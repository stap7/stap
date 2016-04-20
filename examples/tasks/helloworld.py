from json import dumps
if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

#display text "Hello World!"
print(dumps( "Hello World!" ))
#display two buttons
print(dumps( {"Click a button": ["_i","Button 1","Button 2"]} ))
#wait for a click
input()
#clear display
print(dumps( None ))
#add text "Goodbye."
print(dumps( "Goodbye." ))
