/*
  Sample Usage:
  
  const myData = {
    "name": "Root",
    "children": [
      {
        "name": "Branch 1",
        "children": [
          {"name": "Leaf 3"},
          {"name": "Leaf 4"}
        ]
      },
      {"name": "Branch 2"}
    ]
  };
  
  const chart = MindMap()
    .width(900)
    .height(500)
    ;
  
  d3.select('#chart svg')
    .datum(myData)
    .call(chart)
    ;
*/

const MindMap = function() {
  "use strict";
  let margin = {top: 20, left: 120, bottom: 20, right: 120};
  let width = 960;
  let height = 500;
  let duration = 500;
  let identity = '_id';
  let handleClick = function() {};
  let text = function(d) { return d.name };
  let idx = 0;
  let enterNode = function(node) {
    node.append("svg:circle")
      .attr("r", 1e-6);

    node.filter(function(d) { return !!d.url })
      .append("a")
      .attr("xlink:href", function(d) { return d.url; })
      .attr("target", function() { return "_blank"; })
      .on("click", function() { d3.event.stopPropagation(); })
      .append("svg:text")
      .attr("text-anchor", "middle")
      .attr("dy", 16)
      .text(text)
      .style("fill-opacity", 1);
    
    node.filter(function(d) { return !d.url; })
      .append("svg:text")
      .attr("text-anchor", "middle")
      .attr("dy", 16)
      .text(text)
      .style("fill-opacity", 1);
  };
  let updateNode = function(node) {
    node.select("circle")
      .attr("r", 4.5);
  };
  let exitNode = function(node) {
    node.select("circle")
      .attr("r", 1e-6);

    node.select("text")
      .style("fill-opacity", 1e-6);
  }
  let connector = MindMap.elbow;
  let chart = function(selection) {
    selection.each(function(root) {
      let w = width - margin.left - margin.right;
      let h = height - margin.top - margin.bottom;
      let container = d3.select(this);
      let vis = container
          .attr("width", width)
          .attr("height", height);

      let graphRoot = vis.select('g');
      if(!graphRoot[0][0]){
        vis = vis.append('svg:g');
      }else{
        vis = graphRoot;
      }
      vis = vis.attr("transform", "translate(" + (w/2+margin.left) + "," + margin.top + ")");

      if (typeof chart.selectedNode === 'undefined') {
        chart.selectedNode = root;
      }

      root.x0 = h / 2;
      root.y0 = 0;
      
      let tree = d3.layout.tree()
          .size([h, w]);
      
      chart.update = function() {
        container.transition().duration(duration).call(chart);
      };
      
      // Ensure we have Left and Right node lists      
      if (typeof root.left === 'undefined' && typeof root.right === 'undefined'){
        let i=0;
        let l = (root.children||[]).length;

        root.left = [];
        root.right = [];
        for(; i<l; i++){
          if(i%2){
            root.left.push(root.children[i]);
            root.children[i].position = 'left';
          }else{
            root.right.push(root.children[i]);
            root.children[i].position = 'right';
          }
        }
      }
      
      // Compute the new tree layout.
      const nodesLeft = tree
        .size([h, (w/2)-20])
        .children(function(d) {
          return (d.depth === 0) ? d.left : d.children;
        })
        .nodes(root)
        .reverse();

      const nodesRight = tree
        .size([h, w/2])
        .children(function(d) {
          return (d.depth === 0) ? d.right : d.children;
        })
        .nodes(root)
        .reverse();

      root.children = root.left.concat(root.right);

      const nodes = window.nodes = (function (left, right) {
        const root = right[right.length-1];
        left.pop();
        left.forEach(function(node) {
          node.y = -node.y;
          node.parent = root;
        });
        return left.concat(right);
      })(nodesLeft, nodesRight);

      // Update the nodes…
      const node = vis.selectAll("g.node")
        .data(nodes, function(d) { return (d[identity] || (d[identity] = ++idx)); });

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + chart.selectedNode.y0 + "," + chart.selectedNode.x0 + ")"; })
        .on("click", handleClick);

      enterNode(nodeEnter);

      // Transition nodes to their new position.
      const nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      updateNode(nodeUpdate);

      // Transition exiting nodes to the parent's new position.
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function() { return "translate(" + chart.selectedNode.y + "," + chart.selectedNode.x + ")"; })
        .remove();

      exitNode(nodeExit);

      // Update the links…
      const link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target[identity]; });

      // Enter any new links at the parent's previous position.
      link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function() {
          const o = {x: chart.selectedNode.x0, y: chart.selectedNode.y0};
          return connector({source: o, target: o});
        })
        .transition()
        .duration(duration)
        .attr("d", connector);

      // Transition links to their new position.
      link.transition()
        .duration(duration)
        .attr("d", connector);

      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
        .duration(duration)
        .attr("d", function() {
          const o = {x: chart.selectedNode.x, y: chart.selectedNode.y};
          return connector({source: o, target: o});
        })
        .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    });
  };
  
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };
  
  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };
  
  chart.duration = function(_) {
    if (!arguments.length) return duration;
    duration = _;
    return chart;
  };
  
  chart.connector = function(_) {
    if (!arguments.length) return connector;
    connector = _;
    return chart;
  };
  
  chart.click = function(_) {
    if (!arguments.length) return handleClick;
    handleClick = _;
    return chart;
  };
  
  chart.identity = function(_) {
    if (!arguments.length) return identity;
    identity = _;
    return chart;
  };
  
  chart.text = function(_) {
    if (!arguments.length) return text;
    text = _;
    return chart;
  };
  
  chart.nodeEnter = function(_) {
    if (!arguments.length) return enterNode;
    enterNode = _;
    return chart;
  };
  
  chart.nodeUpdate = function(_) {
    if (!arguments.length) return updateNode;
    updateNode = _;
    return chart;
  };
  
  chart.nodeExit = function(_) {
    if (!arguments.length) return exitNode;
    exitNode = _;
    return chart;
  };
  
  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };
  
  return chart;
};

MindMap.elbow = function(d) {
  const source = d.source;
  const target = d.target;
  const hy = (target.y-source.y)/2;
  return `M ${source.y} ${source.x}
          C ${(source.y + target.y) / 2} ${source.x},
          ${(source.y + target.y) / 2} ${target.x},
          ${target.y} ${target.x}`
};

MindMap.loadFreeMind = function(fileName, callback) {
  d3.xml(fileName, 'application/xml', function(err, xml) {
    // Changes XML to JSON
    const xmlToJson = function(xml) {
      
      // Create the return object
      const obj = {};

      if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
          for (let j = 0; j < xml.attributes.length; j++) {
            const attribute = xml.attributes.item(j);
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
      }

      // do children
      if (xml.hasChildNodes()) {
        for(let i = 0; i < xml.childNodes.length; i++) {
          const item = xml.childNodes.item(i);
          const nodeName = item.nodeName;
          if (typeof(obj[nodeName]) == "undefined") {
            obj[nodeName] = xmlToJson(item);
          } else {
            if (typeof(obj[nodeName].push) == "undefined") {
              const old = obj[nodeName];
              obj[nodeName] = [];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(item));
          }
        }
      }
      return obj;
    };
    const js = xmlToJson(xml);
    const data = js.map.node;
    const parseData = function(data, direction) {
      let key;
      let i;
      let l;
      let dir = direction;
      let node = {};
      let child;
      for(key in data['@attributes']){
        node[key.toLowerCase()] = data['@attributes'][key];
      }
      node.direction = node.direction || dir;
      l = (data.node || []).length;
      if(l){
        node.children = [];
        for(i=0; i<l; i++){
          dir = data.node[i]['@attributes'].POSITION || dir;
          child = parseData(data.node[i], {}, dir);
          (node[dir] = node[dir] || []).push(child);
          node.children.push(child);
        }
      }
      return node;
    };
    const root = parseData(data, 'right');
    
    return callback(err, root);
  });
};