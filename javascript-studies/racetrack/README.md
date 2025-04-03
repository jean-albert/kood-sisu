This is our entry for the first javascript group project, racetrack, aka 'info-screens'.

**BASIC SET UP**

For this project to work, you need to install the following:
- node.js
- npm
- ngrok (if you want to test it independently)

Detailed instructions for these are hard to place here, but can be found elsewhere. 

After that, you can start the program with
- npm start
- npm run dev

The former has a 10 minute timer, and the latter a 10 minute timer. 

If you want to test ngrok, you must get an authtoken. It can also be used in cooperation with some else operating ngrok. This version currently uses the following command: 
- npx ngrok http 3000

**USER GUIDE**

The project is a MVP (minimum-viability product) simulation of a racetrack management program. You can create, start, and control races. 

The program is very simple and most of the functions self-explanatory. 

- **front-desk:** here you can create a race, add/remove drivers, and if necessary, delete it. 
    - Currently, you cannot assign individual cars to drivers. The first available car is assigned. 
    - The next race is the earliest session created. Currently, the only way to make a specific next race is deleting all the ones before it.
- **race-control:** start a race, control flags to signal drivers, and end the race session.
- **lap-line-tracker:** mark completed laps for each car. Each car has a corresponding button. 
- **main-index:** this default page is just a list of links for convenience. 

These are all the interfaces required for controlling races. The rest only display information about the races:
- **leader-board**: shows cars with current lap and best laptime
- **race-countdown:** shows the race timer
- **next-race:** shows the upcoming race
- **race-flag:** shows current race mode (safe, hazard, danger, finish)

**Passwords**
- front-desk: 0001
- race-control: 0002
- lap-line-tracker: 0003
- universal: 0000 (this is unnecessary, but added for the convenience of the tester)

Refreshing a page will require another login, but that can be used to test the functioning of sockets. 

**PROJECT STRUCTURE**

**Explanations:**
- *.env*: contains environment variables such as access keys
- *.config.js*: turns variables from .env files into usable consts.
- *server.js*: start the server
- **client**:
    - **js**: all client-side functionality
        - **interfaces**: all interface files, which are used only to pass information to dom-control.js
        - *client-functions.js*: all the functions used by the client
        - *dom-control.js*: transmits variables from HTML
        - *index.js*: assigns event listeners
        - *socket-client.js*: file for client-side socket events
    - **public**: HTML and CSS
- **server**
    - *auth.js*: contains authentication function
    - *func-interface.js*: contains functions related to interface.
    - *func-sessions.js*: contains functions related to race sessions.
    - *func-race.js*: contains functions related to ongoing race
    - *socket-server.js*: file for server-side socket events
- **node_modules**: installed with dependencies. Not necessary to get into detail, but it helps make the project work. 

Event flow
- **client -> server -> client**
- HTML pages interact with interface.js pages
- the interface page or dom-control.js takes info from interface pages to index.js
- index.js assigns event listeners
- client-functions acts based on index.js, call on socket-server.js
- socket-server.js calls on functions, which are separated based on their type (func-interface, func-race, func-sessions)
- socket-client.js or appropriate interface file triggers actions
- The project was originally intended to handle many centrally. This is no longer the case, but most actions of a type are still located in a few general files as opposed to being scattered into multiple places. 

- "client" and "server" communicate through socket.io
    - Client handles input and output, while server stores and controls data
    - Strict hierarchy of actions
    - Information processed centrally
    - Models how a "real" project might operate

Notes:
- dom-control.js is meant to gather up HTML for quick reference. It's been a mixed success...