#!/bin/bash

# Rename all photos in car directories to sequential numbers

cd /app/uploads/tenant-1/cars

echo "Renaming photos to sequential numbers..."

for dir in */; do
  echo "Processing $dir"
  cd "$dir"

  i=1
  for file in $(ls -1 *.webp 2>/dev/null | sort); do
    if [ -f "$file" ] && [ "$file" != "${i}.webp" ]; then
      mv "$file" "${i}.webp"
      echo "  Renamed $file -> ${i}.webp"
    fi
    i=$((i+1))
  done

  cd ..
done

echo ""
echo "Done! Photo counts:"
for dir in */; do
  count=$(ls -1 "$dir"*.webp 2>/dev/null | wc -l)
  echo "  $dir: $count photos"
done
