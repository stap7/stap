<img src="https://raw.githubusercontent.com/vdv7/stap/master/pres/stap-icon.png" width=250 align=right>
STAP (Simple Task-Actor Protocol) is a machine-readable format for specifying user-interface changes. 

Main focus of STAP is in providing a functionally-equivalent task experience for human and computational users alike.
In its focus to make human software usable by machine agents, STAP aims to eliminate non-task-essential design choices (e.g. font type/size may be irrelevant for many task types), leaving those to be optionally specified via customizable templates (e.g. CSS).

STAP messages adhere to JSON formatting, and can be deserialized with any standard JSON library.

Deploying a STAP application is similar to deploying a web application, where STAP takes place of HTML as the language for UI description.
Much like HTML, STAP is a means for serializing task interface display and interactions.
Unlike HTML documents, STAP messages are incremental updates to the display.
Whereas HTML is focused on hypertext look and feel, STAP is focused on function, structure, and affordances of UI elements (though it enables style-sheets for detailed look&feel specification).

Benefits of task development with STAP:
* less code, more GUI
* cross-platform, web-friendly
* millisecond precision time-stamps and timers
* consistent cross-task API, allowing computational agents to interact with the same sw that that human users interact with

Benefits of agent development for STAP-compliant tasks:
* consistent cross-task API, allowing computational agents to interact with the same sw that that human users interact with
* millisecond precision user-time [with faster-than-real-time and slower-than-real-time capabilities]
* cross-platform, web-friendly
* low bar of entry (i.e., core API for text-and-button tasks is minimal, additional UI feature handlers can be added to agent framework on a per-task basis)


Please see [stap.txt](stap.txt) for complete syntax and functionality.



Sample Interactions:

    <-     Message received by task software from user software
    ->     Message sent from task software to user software

    Sample Interaction 1:
        // user software ready
        <- [0,[0]]
        // display "Hello World"
        -> ["Hello World"]
        // display a "Click Me" button
        -> [{"@Click Me":false}]
        // user clicks the button after 30.8s
        <- [30800,"Click Me",true]

    Sample Interaction 2:
        // user software ready
        <- [0,[0]]
        // let user software know that "S" (start time) and "eT" (editable-text field) are required directives for this task
        -> {"require":{"options":["S","eT"]}}
        // let user know that a goal in this task is to earn as close to 10 coins as possible
        -> {"task":{"good":[["Coins Earned",10]]}}
        // display a text prompt to get user's name (eT:1 turns text editable)
        -> [{"@What is your name?":"","eT":1}]
        // user types in "Bob" and hits enter (9.876sec after task display first loaded)
        <- [9876,"What is your name?","Bob"]
        // clear display
        -> null
        // display two buttons
        -> [{"@choose a button":[{"@Button 1":false},{"@Button 2":false}]]
        // first button was clicked after 12.307sec
        <- [12307,"Button 1",true]
        // give user reward, "Coins Earned"=7
        -> [{"@Coins Earned":7}]
        // wait 2 seconds and remove the Coins Earned display
        -> [{"@Coins Earned":null,"S":14307}]
        // second button was clicked
        <- [15422,"Button 2",true]
        // give reward
        -> [{"@Coins Earned":3}]
        ...

    Sample Interaction 3:
        // user software ready
        <- [0,[0]]
        // let user software know that options "w" (width) and "h" (height), type "path", and event 40 (mouse-click) are required for this task
        -> {"require":{"types":["path"],"events":[40],"options":["w","h"]}}
        // display a 100x100 box that will display red lines; "e":[40] signifies that click events should be captured (see <<eventType>> 40 below)
        -> [{"@click somewhere":{},"type":"path","w":100,"h":100,"e":[40]}]
        // user clicked in location 24,60 relative to top-left corner of the box
        <- [1570,"click somewhere",[40,24,60]]
        // draw a line from middle of the box to where user clicked
        -> [{"@click somewhere":[50,50,24,60]}]
        // user clicked in location 91,10 relative to top-left corner of the box
        <- [2307,"click somewhere",[40,91,10]]
        // draw a line from middle of the box to where user clicked
        -> [{"@click somewhere":[50,50,91,10]}]
        // user clicked in location 31,33 relative to top-left corner of the box
        <- [2555,"click somewhere",[40,31,33]]
        // draw a line from middle of the box to where user clicked
        -> [{"@click somewhere":[50,50,31,33]}]
        ...


Please see [stap.txt](stap.txt) for complete syntax and functionality.
