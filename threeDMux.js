import Template from "./template";
import paper, { CompoundPath } from "paper";
import ComponentPort from "../core/componentPort";

export default class ThreeDMux extends Template{
    constructor() {
        super();
    }

    __setupDefinitions() {
        this.__unique = {
            position: "Point"
        };

        this.__heritable = {
            inputNumber: "Float",
            rotation: "Float",
            valveRadius: "Float",
            height: "Float",
            gap: "Float",
            width: "Float",
            length: "Float",
            valveSpacing: "Float",
            channelWidth: "Float"
        };

        this.__defaults = {
            inputNumber: 4,
            rotation: 0,
            valveRadius: 1.2 * 1000,
            height: 0.8 * 1000,
            gap: 0.6 * 1000,
            width: 100,
            length: 100,
            valveSpacing: 0.6 * 1000,
            channelWidth: 500
        };

        this.__units = {
            inputNumber: "",
            rotation: "&deg;",
            valveRadius: "&mu;m",
            height: "&mu;m",
            gap: "&mu;m",
            width: "&mu;m",
            length: "&mu;m",
            valveSpacing: "&mu;m",
            channelWidth: "&mu;m"
        };

        this.__minimum = {
            inputNumber: 2,
            rotation: 0,
            valveRadius: 0.1 * 100,
            height: 0.1 * 100,
            gap: 0.5 * 10,
            width: 100,
            length: 100,
            valveSpacing: 0.1 * 1000,
            channelWidth: 25
        };

        this.__maximum = {
            inputNumber: 32,
            rotation: 360,
            valveRadius: 0.2 * 10000,
            height: 1.2 * 1000,
            gap: 0.1 * 10000,
            width: 100,
            length: 100,
            valveSpacing: 0.1 * 10000,
            channelWidth: 25e3
        };

        this.__featureParams = {
            inputNumber: "inputNumber",
            position: "position",
            rotation: "rotation",
            radius1: "valveRadius",
            radius2: "valveRadius",
            valveRadius: "valveRadius",
            gap: "gap",
            width: "width",
            length: "length",
            valveSpacing: "valveSpacing",
            channelWidth: "channelWidth"
        };

        this.__targetParams = {
            inputNumber: "inputNumber",
            position: "position",
            rotation: "rotation",
            radius1: "valveRadius",
            radius2: "valveRadius",
            valveRadius: "valveRadius",
            gap: "gap",
            width: "width",
            length: "length",
            valveSpacing: "valveSpacing",
            channelWidth: "channelWidth"
        };

        this.__placementTool = "MultilayerPositionTool";

        this.__toolParams = {
            position: "position"
        };

        this.__renderKeys = ["FLOW", "CONTROL", "INVERSE"];

        this.__mint = "3DMUX";
    }

    render2D(params, key) {
        if (key == "FLOW") {
            return this.__drawFlow(params);
        } else if (key == "CONTROL") {
            return this.__drawControl(params);
        }
    }

    render2DTarget(key, params) {
        let ret = new paper.CompoundPath();
        let flow = this.render2D(params, "FLOW");
        let control = this.render2D(params, "CONTROL");
        ret.addChild(control);
        ret.addChild(flow);
        ret.fillColor = params["color"];
        ret.fillColor.alpha = 0.5;
        return ret;
    }

    getPorts(params) {
        let N = params["inputNumber"];
        let horizontal_length = N * 4000;
        let vertical_length = N * 3000;
        let ports = [];

        for (var i = 0; i < N; i++){
            let xpos = i * (horizontal_length/(N-1));
            ports.push(new ComponentPort(xpos, 0, i + 1, "FLOW"))
        }

        ports.push(new ComponentPort(horizontal_length/2, vertical_length + N * 1000, N + 1, "FLOW"));
        // console.log(ports);

        return ports;
    }

    __drawFlow(params) {
        let position = params["position"];
        let gap = params["gap"];
        let radius = params["valveRadius"];
        let color = params["color"];
        let rotation = params["rotation"];
        let channelWidth = params["channelWidth"];
        let threedmux_flow = new paper.CompoundPath();

        let px = position[0];
        let py = position[1];
        let N = params["inputNumber"]; //change this to input
        let bottomlinelength = N * 4000; //modify, so it depends on the input N
        let vertlinelength = N * 3000; //same as above

        let bottomlineleft = new paper.Point(px, py - channelWidth/2 + vertlinelength);
        let bottomlineright = new paper.Point(px + bottomlinelength, py + channelWidth/2 + vertlinelength);
        let channel = new paper.Path.Rectangle(bottomlineleft, bottomlineright);

        threedmux_flow.addChild(channel);

        let valvenum = Math.log(N) / Math.log(2);
        let valveselect = vertlinelength/(2*valvenum);
        let branchArray = new Array(N);
        let centerArray = new Array(N);

        // create base flow 
        for (var i = 0; i < N; i++) {
            let xposbranch = (i)*(bottomlinelength/(N-1));

            let vertlinebottom = new paper.Point(px + xposbranch - channelWidth/2, py + vertlinelength);
            let vertlinetop = new paper.Point(px + xposbranch + channelWidth/2, py);
            let center = new paper.Point (px + xposbranch, py);

            centerArray[i] = new paper.Path.Circle(center, radius);
            branchArray[i] = new paper.Path.Rectangle(vertlinebottom, vertlinetop);
        } 

        // create output port
        let portCon = new paper.Point(px + bottomlinelength/2 - channelWidth/2, py + vertlinelength);
        let portOut = new paper.Point(px + bottomlinelength/2 + channelWidth/2, py + vertlinelength + N * 1000);

        let portRec = new paper.Path.Rectangle(portCon, portOut);

        threedmux_flow.addChild(portRec);


        // add valves and remove parts of channels 
        let cur_N = N;
        let xpos = px;
        let ypos = py + valveselect;

        for (var j = 0; j < valvenum; j++){
            // left side
            let count1 = 0;
            let increment1 = cur_N/2;
            while(count1 < N){
                for (var w = 0; w < cur_N/2; w++){
                    let current_xpos = xpos + ((count1 + w) * bottomlinelength/(N-1));px

                    let cutrec = paper.Path.Rectangle({
                        from: new paper.Point(current_xpos - channelWidth/2, ypos - gap/2),
                        to: new paper.Point(current_xpos + channelWidth/2, ypos + gap/2)
                    })


                    this.__createthreedmuxValve(threedmux_flow, current_xpos, ypos, gap, radius, rotation, channelWidth);
                    branchArray[count1 + w] = branchArray[count1 + w].subtract(cutrec); //remove a portion from the selected channel

                }

                count1 += 2*increment1 ;
            }

            //right side
            let ypos_adjust = vertlinelength/(2*valvenum + 2);
            let count2 = 0;
            let increment2 = cur_N/2;
            ypos += ypos_adjust;

            while(count2 < N){
                for (var w = 0; w < cur_N/2; w++){
                    let current_xpos = xpos + bottomlinelength - ((count2 + w) * bottomlinelength/(N-1));
                    
                    let cutrec = paper.Path.Rectangle({
                        from: new paper.Point(current_xpos - channelWidth/2, ypos - gap/2),
                        to: new paper.Point(current_xpos + channelWidth/2, ypos + gap/2)
                    })

                    branchArray[(N-1) - w - count2] = branchArray[(N-1) - w - count2].subtract(cutrec);
                    this.__createthreedmuxValve(threedmux_flow, current_xpos, ypos, gap, radius, rotation, channelWidth);
                }
                count2 += increment2 + cur_N/2;
            }
            ypos += ypos_adjust;
            cur_N = cur_N/2;
        }

        for (var i = 0; i < N; i++){
            threedmux_flow.addChild(branchArray[i]);
            threedmux_flow.addChild(centerArray[i]);
        }

        threedmux_flow.fillColor = color;

        threedmux_flow.rotate(rotation, new paper.Point(px, py));

        return threedmux_flow;
    }

    __createthreedmuxValve(compound_path, xpos, ypos, gap, radius, rotation, channel_width) {
        let center = new paper.Point(xpos, ypos);

        //Create the basic circle
        let circ = new paper.Path.Circle(center, radius);

        //Add the tiny channel pieces that jut out
        let rec = new paper.Path.Rectangle({
            point: new paper.Point(xpos - channel_width / 2, ypos - radius),
            size: [channel_width, radius],
            stokeWidth: 0
        });

        circ = circ.unite(rec);

        rec = new paper.Path.Rectangle({
            point: new paper.Point(xpos - channel_width / 2, ypos),
            size: [channel_width, radius],
            stokeWidth: 0
        });

        circ = circ.unite(rec);

        let cutout = paper.Path.Rectangle({
            from: new paper.Point(xpos - radius, ypos - gap / 2),
            to: new paper.Point(xpos + radius, ypos + gap / 2)
        });

        let valve = circ.subtract(cutout);

        compound_path.addChild(valve);
    }

    __drawControl(params) {
        let position = params["position"];
        let radius = params["valveRadius"];
        let color = params["color"];
        let rotation = params["rotation"];
        let channelWidth = params["channelWidth"];
        let threedmux_control = new paper.CompoundPath();

        

        let px = position[0];
        let py = position[1];

        let N = params["inputNumber"]; //change this to input
        let bottomlinelength = N * 4000; //modify, so it depends on the input N
        let vertlinelength = N * 3000; //same as above

        let leftInput = px - N * 1000;
        let rightInput = px + bottomlinelength + N * 1000;
        let indexN = N;
        let valvenum = Math.log(N)/Math.log(2);
        let vertholder = vertlinelength/(2*valvenum);

        for (var i = 0; i < 2 * valvenum; i++){
            //left side
            if (i % 2 === 0){
                indexN /= 2;
                let cur_ind = N - indexN - 1; 
                let leftsideLeft = new paper.Point(leftInput, py + vertholder + (i) * vertlinelength/(2*valvenum + 2) - channelWidth/2);
                let center = new paper.Point(leftInput, py + vertholder + i * vertlinelength/(2*valvenum + 2));
                let circle = new paper.Path.Circle(center, radius);
                threedmux_control.addChild(circle);
                let leftsideRight = new paper.Point(px + cur_ind * (bottomlinelength/(N-1)), py + vertholder + (i) * vertlinelength/(2*valvenum + 2) + channelWidth/2);
                center = new paper.Point(px + cur_ind * (bottomlinelength/(N-1)), py + vertholder + (i) * vertlinelength/(2*valvenum + 2));
                circle = new paper.Path.Circle(center, radius);
                threedmux_control.addChild(circle);
                let leftcontrol = new paper.Path.Rectangle(leftsideLeft, leftsideRight);

                threedmux_control.addChild(leftcontrol);
            }
            //right side
            else {
                let cur_ind = indexN;
                let rightsideLeft = new paper.Point(px + cur_ind * (bottomlinelength/(N-1)), py + vertholder + (i) * vertlinelength/(2*valvenum + 2) - channelWidth/2);
                let center = new paper.Point(px + cur_ind * (bottomlinelength/(N-1)), py + vertholder + (i) * vertlinelength/(2*valvenum + 2));
                let circle = new paper.Path.Circle(center, radius);
                threedmux_control.addChild(circle);
                let rightsideRight = new paper.Point(rightInput, py + vertholder + (i) * vertlinelength/(2*valvenum + 2) + channelWidth/2);
                center = new paper.Point(rightInput, py + vertholder + (i) * vertlinelength/(2*valvenum + 2));
                circle = new paper.Path.Circle(center, radius);
                threedmux_control.addChild(circle);
                let rightcontrol = new paper.Path.Rectangle(rightsideLeft, rightsideRight);

                threedmux_control.addChild(rightcontrol);
            }
        }

        threedmux_control.fillColor = color;
        threedmux_control.rotate(rotation, new paper.Point(px, py));

        return threedmux_control;
    }
}