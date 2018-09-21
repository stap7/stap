#!/usr/bin/env python3

if 'raw_input' in vars(__builtins__): input = raw_input		#Fix for Python 2.x raw_input

input()
print('["Hello, World!",{"id":"Press Me","v":false}]')
input()
print('null')
print('["You pressed the button!"]')

import json

