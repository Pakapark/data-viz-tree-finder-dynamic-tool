import csv

counter = 0
with open("trees.csv", 'r') as f:
    reader = csv.reader(f)
    for row in reader:
         if row[6] == "" or row[7] == "":
             counter += 1

print counter
