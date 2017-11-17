#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: ./init.sh <RASPBERRY_ID>"
    exit 1
fi

ID="'""$1""'"

echo 'export RASPBERRY_ID='"$ID" | sudo tee /etc/profile.d/raspberry_id.sh > /dev/null
echo "echo 'Raspberry id: '"'"$RASPBERRY_ID"' | sudo tee -a /etc/profile.d/raspberry_id.sh > /dev/null
