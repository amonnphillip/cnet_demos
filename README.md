# cnet_demo1
Convolution network experiments based on work done by Andrej Kapathy https://github.com/karpathy.

I am interested in machine learning, and how it applies to gaming. This  demo seeks to explore conv-net training with navigation and path finding.


## Convolutional network experiments
### Installation
You can run this experiment from your browser on your local machine. Install [NodeJs](https://nodejs.org) and [npm](https://www.npmjs.com/). This project was set up and run in a Windows environment, but should also work in Linux.

Open a command prompt in administrator mode then type the following to install grunt cli globally. On linux you may need to invoke the commands under sudo (haven't tried it yet though :S).
```shell
npm install -g grunt-cli
```

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide. You don't really need to know much about Grunt, but in case you get lost...

Then install dependent packages. The following command must be run in the same directory as the package.json file.
```shell
npm install
```

Now all you need to do is run the demo. The following command must be run in the same directory as the gruntfile.js file.
```shell
grunt
```

If you have Chrome installed Grunt should open the browser for you, and then open a browser tab for you at the correct Url. If not you can just open a browser at localhost:8000. The experiment should start in the served page and begin training.


### What is this?
In this experiment we train a conv-net to navigate a maze towards a goal. To do this we provide the conv-net with an input state, which the net is trained against and provides an output. The input state contains the following:

Scores for the 4 directions the agent can move in (left, right, up, down). Scoring here is very basic, a score of 0 means that direction is clear, a score of 1 means a wall is in the way.
Scores for the 4 directions based on the number of times the agent has been on that cell in the maze. Every time the agent steps on that tile the score is increased a little.
Distance from the agent to the goal (normalized).

The outputs from the network are directions (actions) the network suggests given the current input state.


You will notice over several training iterations that the agent gets slowly better at moving towards the goal from the starting point. Over about 2000 iterations the agent should move towards the goal with some efficiency.

Also notice that because we punish the network (punish meaning we give network a smaller reward) for suggesting walking into a wall, that these actions suggestions are slowly trained out of the output.


The agent is basically a very near sighted creature. It can only see one tile in each direction, and has a memory for if it has been in a tile before, and how many times it has been in those tiles. From this simple input it can be trained to navigate fixed maze with some efficiency.


I am just beginning to learn conv-nets, deep-learning concepts and their application to gaming. This is my first attempt at maze navigation..
