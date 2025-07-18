#!/bin/bash

dotnet publish "Douji Backend.csproj" -c Release -o bin/Publish /p:UseAppHost=false
