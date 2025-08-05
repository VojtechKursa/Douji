#!/bin/sh

run_once=0
skip_initial=0
display_help=0

for arg in "$@"; do
	if [ $arg = '--help' -o $arg = '-h' ]; then
		display_help=1
		break
	elif [ $arg = '--skip' -o $arg = '-s' ]; then
		skip_initial=1
	elif [ $arg = '--once' -o $arg = '-o' ]; then
		run_once=1
	else
		echo "Unrecognized argument: $arg"
		exit 1
	fi
done

if [ $display_help -ne 0 ]; then
	echo 'Certbot renew script'
	echo 'Usage: certbot-renew [args]'
	echo 'Arguments:'
	echo '    -h, --help    Display help message'
	echo '    -s, --skip    Skip the initial check'
	echo '                  (Check only after the next interval)'
	echo '    -o, --once    Run only once (Do not loop)'
	exit 0
fi

first_iteration=1

function renew {
	certbot renew
	nginx -s reload
}

while :
do
	if [ $first_iteration -ne 0 ]; then
		if [ $skip_initial -eq 0 ]; then
			renew
		fi

		first_iteration=0
	else
		renew
	fi

	if [ $run_once -ne 0 ]; then
		exit 0
	fi

	sleep 24h
done