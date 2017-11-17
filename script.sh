#!/bin/bash

cp init.sh main-updater.sh /home/pi/
cd /home/pi
./init.sh '1jh89df*EM'
./main-updater.sh
