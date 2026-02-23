# Import the 'datetime' module to work with date and time
import datetime
import json

# Get the current date and time
now = datetime.datetime.now()

# Print the current date and time in a specific format
print(json.dumps("Current date and time: " + now.strftime("%Y-%m-%d %H:%M:%S")))
