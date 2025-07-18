import os

INPUT_FILE = "douji.conf.template"
OUTPUT_FILE = "douji.conf"


def get_env_bool(name: str) -> bool | None:
    val = os.getenv(name)

    if val == None:
        return None

    val = val.lower()

    if val == "0" or val == "false":
        return False
    if val == "1" or val == "true":
        return True

    raise SyntaxError(
        f"Environment variable {name} has invalid syntax: Expected bool, actual value: '{val}'")


def get_env_ints(name: str) -> list[int]:
    val = os.getenv(name)

    if val == None:
        return []

    lst = val.split()
    result = [int(s) for s in lst]

    return result


def get_env_strings(name: str) -> list[str]:
    val = os.getenv(name)

    if val == None:
        return []

    return val.split()


HTTPS_REDIRECT = get_env_bool("DOUJI_HTTPS_REDIRECT")
HTTP_PORTS = get_env_ints("DOUJI_HTTP_PORTS")
HTTPS_PORTS = get_env_ints("DOUJI_HTTPS_PORTS")
URLS = get_env_strings("DOUJI_URL")
DEV = get_env_bool("DOUJI_DEV")

ACME_LOCATION = [
    "location /.well-known/acme-challenge/ {",
    "\troot /var/www/certbot;",
    "}"
]


def set_redirect(input: str) -> str:
    if HTTPS_REDIRECT:
        port = 443 if len(HTTPS_PORTS) < 1 else HTTPS_PORTS[0]
        http_listens = [f"\tlisten {port};\n" for port in HTTP_PORTS]

        locations = [
            "location / {",
            "\treturn 308 https://$host" +
            (f":{port}" if port != 443 else "") + "$request_uri;",
            "}"
        ]

        if not DEV:
            locations.append("")
            locations.extend(ACME_LOCATION)

        replacement = [
            "server {",
            "".join(http_listens),
            f"\tserver_name {" ".join(URLS)};",
            "",
            "\t" + "\n\t".join(locations),
            "}",
        ]

        replacement = "\n".join(replacement)

        return input.replace("${HTTPS_REDIRECT};", replacement)
    else:
        return input.replace("${HTTPS_REDIRECT};", "")


def set_ports(input: str) -> str:
    http_listens = []
    if not HTTPS_REDIRECT:
        http_listens = [f"\tlisten {port};\n" for port in HTTP_PORTS]

    https_listens = [f"\tlisten {port} ssl;\n" for port in HTTPS_PORTS]

    replacement = "".join(http_listens) + "".join(https_listens)

    return input.replace("${PORTS};", replacement.removeprefix("\t").removesuffix("\n"))


def set_url(input: str) -> str:
    return input.replace("${URLS}", " ".join(URLS))


def set_acme_location(input: str) -> str:
    replacement = ""
    if not DEV:
        replacement = "\t" + "\t\n".join(ACME_LOCATION)

    return input.replace("${ACME_LOCATION};", replacement)


def set_ssl_certs(input: str) -> str:
    replacement = ""
    if len(HTTPS_PORTS) > 0:
        replacement = "\n\t".join([
            "ssl_certificate        /etc/ssl/douji/fullchain.pem;",
            "ssl_certificate_key    /etc/ssl/douji/privkey.pem;",
        ])

    return input.replace("${CERTS};", replacement)


def main():
    input_file = open(INPUT_FILE, "rt")
    output_file = open(OUTPUT_FILE, "wt")

    input = "".join(input_file.readlines())
    output = set_ssl_certs(
        set_acme_location(
            set_url(
                set_ports(
                    set_redirect(input)
                )
            )
        )
    )

    output_file.write(output)

    input_file.close()
    output_file.close()


if __name__ == '__main__':
    main()
