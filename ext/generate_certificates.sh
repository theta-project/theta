#!/bin/bash

echo "Generating self-signed certificates"
openssl req -new -x509 -days 3650 -config openssl.conf -out cert.pem

echo "Creating .crt to import on windows"
openssl x509 -outform der -in cert.pem -out cert.crt

echo "Making /home/certs"
sudo mkdir /home/certs

echo "Moving certs to /home/certs"
mv *.pem /home/certs/

echo "...Done!"