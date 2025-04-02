count=$(find . -type f -o -type d | wc -l)
printf "\t\vTotal files * 5: %d\v\n" $((count * 5))
