#!/bin/bash
set -euo pipefail
IFS=$'\n\t'


if [[ $# -lt 1 ]]; then
    echo "Provide the project root as the first argument. (No first argument)" 1>&2
    exit 1
fi

if [[ ! -f $1/index.js ]]; then
    echo "Provide the project root as the first argument. (first arg: '$1')" 1>&2
    exit 1
fi

project_root=$1

zip -r $project_root/lambda.zip $project_root/package.json $project_root/index.js $project_root/lib $project_root/node_modules
echo "Now you can upload your $project_root/lambda.zip"
echo "try: https://us-west-2.console.aws.amazon.com/lambda/home"
