#!/bin/bash
cd images/original

rm -rf ../icons
mkdir ../icons

for i in *.png; 
   do convert "$i" -filter box -resize 200% xc:"#DDDDDD" -fx 'u*v.p{0,0}' "../icons/${i%.*}_light.png"; 
done

for i in *.png; 
   do convert "$i" -filter box -resize 200% xc:"#000000" -fx 'u*v.p{0,0}' "../icons/${i%.*}_dark.png"; 
done