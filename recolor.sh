#!/bin/bash

if [ -z "$1" ]; then echo "must specify arguments color and name"; exit 1; fi
if [ -z "$2" ]; then echo "must specify arguments color and name"; exit 1; fi

cd images

rm -rf output
mkdir output

for i in *.png; 
   do convert "$i" xc:"$1" -fx 'u*v.p{0,0}' "output/${i%.*}_$2.png"; 
done