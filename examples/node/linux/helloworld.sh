(sleep 3; xdg-open ../../taskServer/helloworld.html) &
./node ../../taskServer/stdio2socketServ.js "python ../../tasks/helloworld.py" -w 8888 -h "../../taskServer/helloworld.htm"
