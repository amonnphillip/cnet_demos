
var canvas, ctx;
    
    // A 2D vector utility
    var Vec = function(x, y) {
      this.x = x;
      this.y = y;
    }
    Vec.prototype = {
      
      // utilities
      dist_from: function(v) {
        return Math.sqrt(Math.pow(this.x-v.x,2) + Math.pow(this.y-v.y,2));
      },
      length: function() {
        return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
      },
      
      // new vector returning operations
      add: function(v) {
        return new Vec(this.x + v.x, this.y + v.y);
      },
      sub: function(v) {
        return new Vec(this.x - v.x, this.y - v.y);
      },
      rotate: function(a) {  // CLOCKWISE
        return new Vec(this.x * Math.cos(a) + this.y * Math.sin(a),
                       -this.x * Math.sin(a) + this.y * Math.cos(a));
      },
      
      // in place operations
      scale: function(s) {
        this.x *= s; this.y *= s;
      },
      normalize: function() {
        var d = this.length(); this.scale(1.0/d);
      }
    }

    var World = function() {
      this.agent = undefined;
      
      this.clock = 0;

      // set up the maze
      this.maze = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];

      this.maze.goal = {
        x: 8,
        y: 8
      };

      this.maze.dimentions = {
        w: 10,
        h: 10
      };

      this.maze.start = {
        x: 1,
        y: 1
      };
    }
    
    World.prototype = {
      tick: function() {
        // tick the environment
        this.clock++;

        // let the agent behaves in the world based on their input
        this.agent.forward();

        // Inc steps
        this.agent.steps ++;

        // move agent(s)
        if (w.maze[this.agent.p.y + this.agent.action[1]][this.agent.p.x + this.agent.action[0]] === 0) {
          this.agent.p.x += this.agent.action[0];
          this.agent.p.y += this.agent.action[1];
          this.agent.pathMap[this.agent.p.y][this.agent.p.x] ++;
        }

        // agent is given the opportunity to learn based on feedback of their action on environment
        this.agent.backward();

        // Check if the agent has reached the goal and reset it
        if (this.agent.p.x === w.maze.goal.x &&
          this.agent.p.y === w.maze.goal.y) {

          console.log('Hit goal:');
          console.log('steps: ' + this.agent.steps + ' wall hits: ' + this.agent.wallRuninsCount + ' oversteps: ' + this.agent.walkBackCount);

          this.agent.p.x = w.maze.start.x;
          this.agent.p.y = w.maze.start.y;
          this.agent.steps = 0;
          this.agent.wallRuninsCount = 0;
          this.agent.walkBackCount = 0;

          this.agent.wallCollideReward = 0;
          this.agent.wallOverReward = 0;
          this.agent.stepsReward = 0;
          this.agent.distanceReward = 0;
        }
      }
  }
    // A single agent
    var Agent = function() {
    
      // positional information
      this.p = new Vec(1, 1);
      this.op = this.p; // old position

      this.wallRuninsCount = 0;
      this.walkBackCount = 0;
      this.steps = 0;
      this.goalDist = 0;
      this.wallCollideReward = 0;
      this.wallOverReward = 0;
      this.stepsReward = 0;
      this.distanceReward = 0;
      this.reward = 0;

      this.actions = [];
      this.actions.push([0,1]);
      this.actions.push([0,-1]);
      this.actions.push([1,0]);
      this.actions.push([-1,0]);

      this.pathMap;

      var num_inputs = 4 + 4 + 1; //open directions, distance from reward etc
      var num_actions = 4;
      var temporal_window = 1; // amount of temporal memory. 0 = agent lives in-the-moment :)
      var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
      var layer_defs = [];
      layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
      layer_defs.push({type:'fc', num_neurons: 200, activation:'relu'});
      layer_defs.push({type:'fc', num_neurons: 200, activation:'relu'});
      layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
      var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

      var opt = {};
      opt.temporal_window = temporal_window;
      opt.experience_size = 3000;
      opt.start_learn_threshold = 100;
      opt.gamma = 0.7;
      opt.learning_steps_total = 2000;
      opt.learning_steps_burnin = 300;
      opt.epsilon_min = 0.05;
      opt.epsilon_test_time = 0.05;
      opt.layer_defs = layer_defs;
      opt.tdtrainer_options = tdtrainer_options;

      this.brain = new deepqlearn.Brain(num_inputs, num_actions, opt);
    }
    Agent.prototype = {
      createPathMap: function() {
        this.pathMap = new Array(w.maze.dimentions.w);
        for (var index = 0;index < w.maze.dimentions.w;index ++) {
          this.pathMap[index] = new Array(w.maze.dimentions.h);
        }

        for (var y = 0;y < w.maze.dimentions.w; y ++) {
          for (var x = 0;x < w.maze.dimentions.h; x ++) {
            this.pathMap[y][x] = 0;
          }
        }
      },
      forward: function() {
        // in forward pass the agent simply behaves in the environment
        if (typeof this.pathMap === 'undefined') {
          this.createPathMap();
        }

        var calcPathMapResistance = function(x, y) {
          var p = this.pathMap[y][x];
          if (p > 10) {
            p = 10;
          }

          return p / 10;
        }.bind(this);

        var input_array = new Array(4 + 4 + 1);
        var index = 0;

        // directions that are clear
        input_array[index] = 1;
        input_array[index + 1] = 1;
        input_array[index + 2] = 1;
        input_array[index + 3] = 1;
        if (w.maze[this.p.y - 1][this.p.x] === 1) { // can agent go up
          input_array[index] = 0;
        }
        if (w.maze[this.p.y + 1][this.p.x] === 1) { // can agent go down
          input_array[index + 1] = 0;
        }
        if (w.maze[this.p.y][this.p.x + 1] === 1) { // can agent go left
          input_array[index + 2] = 0;
        }
        if (w.maze[this.p.y][this.p.x - 1] === 1) { // can agent go right
          input_array[index + 3] = 0;
        }
        index += 4;

        // directions that agent has been to
        input_array[index] = calcPathMapResistance(this.p.y - 1, this.p.x);
        input_array[index + 1] = calcPathMapResistance(this.p.y + 1, this.p.x);
        input_array[index + 2] = calcPathMapResistance(this.p.y, this.p.x + 1);
        input_array[index + 3] = calcPathMapResistance(this.p.y, this.p.x - 1);
        index += 4;

        // how close the agent is to the goal
        var v = new Vec(this.p.x, this.p.y);
        var dist = v.dist_from(new Vec(w.maze.goal.x, w.maze.goal.y));
        input_array[index] = dist / 10;
        index ++;
        w.agent.goalDist = dist / 10;
        
        // get action from brain
        var actionix = this.brain.forward(input_array);
        this.action = this.actions[actionix];
      },
      backward: function() {
        // in backward pass agent learns

        // reward weights
        var maxWallCollideReward = 0.5;
        var maxWallCollideRatioReward = 0.2
        var maxWalkOverReward = 0.2;
        var maxStepsReward = 0.2;
        var maxDistanceReward = 0.3;
        var maxCloserToGoalReward = 0.2;

        // reward totals
        var wallCollideReward = 0;
        var wallCollideRatioReward = 0;
        var wallOverReward = 0;
        var stepsReward = 0;
        var distanceReward = 0;
        var closerToGoal = 0;

        // calculate number of steps reward
        var v = new Vec(this.p.x, this.p.y);
        var dist = v.dist_from(new Vec(w.maze.goal.x, w.maze.goal.y));
        distanceReward = Math.abs((dist/10) - 1) * maxDistanceReward;

        var minStepsForMaze = 20;
        var maxSteps = 200;
        if (this.steps < minStepsForMaze) {
          stepsReward = maxStepsReward;
        } else {
          stepsReward = maxStepsReward - ((maxStepsReward / maxSteps) * this.steps);
          if (stepsReward < 0) {
            stepsReward = 0;
          }
        }

        // calculate walking into walls reward and punish for trying to walk into walls
        if (w.maze[this.p.y + this.action[1]][this.p.x + this.action[0]] === 1) {
          wallCollideReward = 0;
          w.agent.wallRuninsCount ++;
        } else {
          wallCollideReward = maxWallCollideReward;
        }

        if (w.agent.wallRuninsCount === 0) {
          wallCollideRatioReward = maxWallCollideRatioReward;
        } else {
          wallCollideRatioReward = maxWallCollideRatioReward / w.agent.wallRuninsCount;
        }

        // calculate walking over parts of the maze the agent has been to before and punish for trying walk over previous path
        if (this.pathMap[this.p.y + this.action[1]][this.p.x + this.action[0]] > 0) {
          wallOverReward = 0;
          w.agent.walkBackCount ++;
        } else {
          wallOverReward = maxWalkOverReward;
        }

        // reward for being closer to the goal
        if (w.agent.distanceReward < distanceReward) {
          closerToGoal = maxCloserToGoalReward;
        }

        // reward for hitting goal
        if (this.p.x === w.maze.goal.x &&
          this.p.y === w.maze.goal.y) {
          this.createPathMap();
        }

        var reward = wallCollideReward + wallOverReward + stepsReward + distanceReward + wallCollideRatioReward + closerToGoal;

        if (reward > 1) {
          reward = 1;
        }

        w.agent.wallCollideReward = wallCollideReward;
        w.agent.wallOverReward = wallOverReward;
        w.agent.stepsReward = stepsReward;
        w.agent.distanceReward = distanceReward;
        w.agent.reward = reward;

        // pass to brain for learning
        this.brain.backward(reward);
      }
    }
    
    function draw_net() {
      var neuronSize = 3;


      if(simspeed <=1) {
        // we will always draw at these speeds
      } else {
        if(w.clock % 50 !== 0) return;  // do this sparingly
      }

      var canvas = document.getElementById("net_canvas");
      var ctx = canvas.getContext("2d");
      var W = canvas.width;
      var H = canvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var layerDisplayWidth = w.agent.brain.value_net.layers / (canvas.width - 20);


      var L = w.agent.brain.value_net.layers;
      //var dx = (W - layerDisplayWidth)/L.length;
      var x = 10;
      var y = 40;



      ctx.font="12px Verdana";
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillText("Value Function Approximating Neural Network:", 10, 14);
      for(var k=0;k<L.length;k++) {
        if(typeof(L[k].out_act)==='undefined') continue; // maybe not yet ready
        var kw = L[k].out_act.w;
        var n = kw.length;
        var dy = (H-50)/n;
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillText(L[k].layer_type + "(" + n + ")", x, 35);
        for(var q=0;q<n;q++) {
          var v = Math.floor(kw[q]*100);
          if(v >= 0) ctx.fillStyle = "rgb(0,0," + v + ")";
          if(v < 0) ctx.fillStyle = "rgb(" + (-v) + ",0,0)";
          ctx.fillRect(x , y, neuronSize, neuronSize);
          y += neuronSize;
          if(y>H-25) { y = 40; x += neuronSize};
        }
        x += 50;
        y = 40;
      }
    }
    
    var reward_graph = new cnnvis.Graph();
    function draw_stats() {
      var canvas = document.getElementById("vis_canvas");
      var ctx = canvas.getContext("2d");
      var W = canvas.width;
      var H = canvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var a = w.agent;
      var b = a.brain;
      var netin = b.last_input_array;
      ctx.strokeStyle = "rgb(0,0,0)";
      //ctx.font="12px Verdana";
      //ctx.fillText("Current state:",10,10);
      ctx.lineWidth = 10;
      ctx.beginPath();
      for(var k=0,n=netin.length;k<n;k++) {
        ctx.moveTo(10+k*12, 120);
        ctx.lineTo(10+k*12, 120 - netin[k] * 100);
      }
      ctx.stroke();
      
      if(w.clock % 200 === 0) {
        reward_graph.add(w.clock/200, b.average_reward_window.get_average());
        var gcanvas = document.getElementById("graph_canvas");
        reward_graph.drawSelf(gcanvas);
      }
    }

    // Draw everything
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var bw = canvas.width / 10;
      var bh = canvas.height / 10;

      for (var y = 0;y < 10; y ++) {
        for (var x = 0;x < 10; x ++) {
          if (w.maze[y][x] === 1) {
            ctx.fillStyle="#000000";
            ctx.fillRect(x * bw, y * bh,  bw, bh);
          }

          if (w.agent.pathMap[y][x] > 1) {
            var col = 255 - (w.agent.pathMap[y][x] * 3);
            if (col > 128) {
              col = 128
            };

            ctx.fillStyle="#999999";
            ctx.fillRect(x * bw, y * bh,  bw, bh);
          }
        }
      }

      ctx.fillStyle="#FF0000";
      ctx.fillRect(w.agent.p.x * bw, w.agent.p.y * bh, bw, bh);

      ctx.fillStyle="#006600";
      ctx.fillRect(w.maze.goal.x * bw, w.maze.goal.y * bh, bw, bh);

      ctx_metrics.clearRect(0, 0, canvas_metrics.width, canvas_metrics.height);
      ctx_metrics.font="12px Verdana";
      ctx_metrics.fillStyle = "rgb(0,0,0)";
      ctx_metrics.fillText("steps = " + w.agent.steps, 10, 14);
      ctx_metrics.fillText("wall hits = " + w.agent.wallRuninsCount, 10, 24);
      ctx_metrics.fillText("back walks = " + w.agent.walkBackCount, 10, 34);
      ctx_metrics.fillText("dist = " + w.agent.goalDist, 150, 14);

      ctx_metrics.fillText("rewards = " + w.agent.reward, 10, 44);
      ctx_metrics.fillText("cl: " + w.agent.wallCollideReward + ' wo: ' + w.agent.wallOverReward + 'st: ' + w.agent.stepsReward + ' ds: ' +  w.agent.distanceReward, 10, 54);

      w.agent.brain.visSelf(document.getElementById('brain_info_div'));
    }
    
    // Tick the world
    function tick() {
      w.tick();
      draw();
      draw_stats();
      draw_net();
    }
    
    var simspeed = 2;
    function gofast() {
      window.clearInterval(current_interval_id);
      current_interval_id = setInterval(tick, 0);
      skipdraw = false;
      simspeed = 2;
    }
    
    var w; // global world object
    var current_interval_id;
    var skipdraw = false;
    function start() {
      canvas = document.getElementById("canvas");
      ctx = canvas.getContext("2d");
      canvas_metrics = document.getElementById("metrics_canvas");
      ctx_metrics = canvas_metrics.getContext("2d");

      w = new World();
      w.agent = new Agent();
      
      gofast();
    }