#!/bin/sh

set -e

crond -b -L /var/log/crond.log

INIT_DONE="/acme/.init_done"
if [ ! -e $INIT_DONE ]; then
	echo "-- Generating DH Parameter"
	openssl dhparam -out /acme/dhparam.pem 2048
    echo "-- Obtaining certificate --"
    acme.sh --standalone --issue -w /var/www -d $LAB_DOMAIN_NAME
    touch $INIT_DONE
fi

for f in $(find /usr/local/nginx/conf -regex '.*\.conf'); do envsubst '${LAB_DOMAIN_NAME}' < $f > $f.tmp && mv $f.tmp $f; done

/usr/local/nginx/sbin/nginx