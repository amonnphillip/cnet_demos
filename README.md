# cnet_demos
Convolution network experiments based on work done by Andrej Kapathy https://github.com/karpathy

## Convolutional network experiments
### Installation
You can serve this experiment from your browser on your local machine. Install [NodeJs](https://nodejs.org) and [npm](https://www.npmjs.com/)

Then install grunt cli globally.
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

### What is this?
In this experiment we try and train a conv-net to navigate a maze towards a goal. The input for the network a state containing the following:

Directions the agent can move in (left, right, up, down)
Scores for the 4 directions based on the number of times the agent has been on that cell in the maze
Distance from the agent to the goal

The outputs from the network are positions the agent should move in

You will notice over several training iterations that the agent gets slowly better at moving towards the goal fro the starting point. Over about 2000 iterations the agent should move towards the goal with some efficiency.

Also notice that because we punish the network for suggesting waling into walls that these actions suggestions are slowly trained out of the output.


As started I am just beginning to learn conv-nets, and its applications for gaming, and this is my first attempt at maze navigation..