var graphApi = {} 

window.onload = function() {
  var oldVals = [],
      svg,
      width = 500,
      height = 500,
      radius = Math.min(width, height) / 2,
      partition,
      depth,
      x, y, default_x, default_y,
      color = d3.scale.category10();

  var tooltip;

  var arc = d3.svg.arc()
      .startAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
      })
      .endAngle(function (d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
      })
      .innerRadius(function (d) {
        return Math.max(0, y(d.y));
      })
      .outerRadius(function (d) {
        // check if current node is a leaf node
        return d.children && d.children !== [] 
          // compute with default dy offset
          ? Math.max(0, y(d.y +  d.dy))
          // extend the outer radius to match maximal depth
          : Math.max(0, y(d.y + (depth - d.depth+1) * d.dy))
      });


  
  function initGraph() {
    svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ") rotate(-90 0 0)");
    
    partition = d3.layout.partition()
        .value(function (d) {
            return d.value;
        });
  }

  /**
   * @param {object} data - given input data
   */
  function getDepth(data) {

    function _getDepth(data, depth){
      var _depth = depth;

      if(data.children && data.children !== []) {
        data.children.forEach(function(_child) {
          _depth = Math.max(_getDepth(_child, depth+1), _depth);
        })
      }

      return _depth;
    }

    return _getDepth(data, 0)
  }

  function draw(data, depth) {

    var g = svg.selectAll(".new-pie-element")
        .data(data)
        .enter()
          .append("g")
          .classed('new-pie-element',true)
          .classed('pie-elem', true);


    var path = g.append("path")
        .attr("d", arc)
        .style("fill", function (d) {
            return color((d.children ? d : d.parent).name);
        })
        .on("click", changeLevel);

    path.on('mousemove', function(d) {
      tooltip.select('.label-text').text(d.name);
      if(d.parent) {
        tooltip.select('.value-text').text(d.value);
      }
      tooltip.attr('opacity',1);
      tooltip.attr('transform', 'translate('+[d3.event.offsetX,d3.event.offsetY]+')');
    });

    path.on('mouseout', function(d) {
      tooltip.attr('opacity',0)
    });

    var text = g.append("text")
      .attr("x", function (d) {
          return y(d.y);
      })
      .attr('opacity',function(d) {
        if(!d.parent) return;
        else return d.value/d.parent.value>0.1 ?
          1 : 0;
      })
      .attr("dx", "6") // margin
      .attr("dy", ".35em") // vertical-align
      .attr("transform", function (d) {
          return "rotate(" + computeTextRotation(d) + ")";
      })
      .text(function (d) {
          return d.name;
      })
      .style("fill","white");

    // Word wrap!
    var insertLinebreaks = function (t, d, width) {
        alert(0)
        var el = d3.select(t);
        var p = d3.select(t.parentNode);
        p.append("g")
        .attr("x", function (d) {
          return y(d.y);
        })
        .attr("transform", function (d) {
          return "rotate(" + computeTextRotation(d) + ")";
        })
        .append("foreignObject")
          .attr('x', -width/2)
          .attr("width", width)
          .attr("height", 200)
          .append("xhtml:p")
            .attr('style','word-wrap: break-word; text-align:center;')
            .html(d.name);    
        alert(1)
        el.remove();
        alert(2)
    };

    d3.select(self.frameElement).style("height", height + "px");
  }

  function changeLevel(d) {
      // fade out all text elements
      if(d.value !== undefined) {
          d.value += 100;
      };
      d3.selectAll('.pie-elem text')
        .transition()
        .attr("opacity", 0);

      d3.selectAll('.pie-elem path')
        .transition()
          .duration(750)
          .attrTween("d", arcTween(d))
          .each("end", function (e, i) {
            // check if the animated element's data e lies within the visible angle span given in d
            if (e.x >= d.x && e.x < (d.x + d.dx)) {
              // get a selection of the associated text element
              var arcText = d3.select(this.parentNode).select("text");
              // fade in the text element and recalculate positions
              arcText.transition()
                  .duration(750)
                  .attr("opacity", 1)
                  .attr("transform", function () {
                      return "rotate(" + computeTextRotation(e) + ")"
                  })
                  .attr("x", function (d) {
                    return y(d.y);
                  });
              }
          });

  } //});

  function changeLevelWithoutTransition() {
      x = default_x; y = default_y;

      d3.selectAll('.pie-elem path')
        .attr('opacity',0)
        .attr("d", arc)
        .transition()
        .duration(400)
        .attr('opacity',1);

      d3.selectAll('.pie-elem text')
        .attr('opacity', 1)
        .attr("transform", function (d) {
            return "rotate(" + computeTextRotation(d) + ")"
        })
        .attr("x", function (d) {
          return y(d.y);
        });
  }
  function computeTextRotation(d) {
      var angle = x(d.x + d.dx / 2) - Math.PI / 2;
      return angle / Math.PI * 180;
  }

  // Interpolate the scales!
  function arcTween(d) {
      var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
          yd = d3.interpolate(y.domain(), [d.y, 1]),
          yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
      return function (d, i) {
        return i 
        ? function (t) {return arc(d);} 
        : function (t) {
          x.domain(xd(t));
          y.domain(yd(t)).range(yr(t));
          return arc(d);
        };
      };
  }

  function update(data) {
    data.root = true;

    x = d3.scale.linear()
        .range([0, 2 * Math.PI]);
    
    default_x = d3.scale.linear()
        .range([0, 2 * Math.PI]);;

    y = d3.scale.sqrt()
        .range([0, radius]);

    default_y = d3.scale.sqrt()
        .range([0, radius]);

    var upd = [];
    var newValues = [];
    depth = getDepth(data);
    data =  partition.nodes(data);

    var g = d3.selectAll('.pie-elem')
      .each(function(a, i) {
        if(!a.parent)  {
          a.value = data[0];
          data[0] = null;
          return;
        }

        var nonzero = false;
        for(var i in data) {
          var b = data[i];
          if( b && b.name === a.name && b.parent.name === a.parent.name) {
            // update value
            a.x = b.x;
            a.y = b.y;
            a.value = b.value;
            a.dx = b.dx;
            a.dy = b.dy;

            nonzero = true;
            data[i] = null
            break;
          }
        }
        // if there is no updated for the node
        if(!nonzero) a.value = 0;
      })
      .classed('new-pie-element', false)
    
    g.filter(function(d) { return d.value === 0 }).remove();
    
    var root = d3.select('.pie-elem');

    d3.selectAll('.pie-elem path')
      .transition(750)
      .attr('d',arc)

    d3.selectAll('.pie-elem text')
      .attr("x", function (d) {
          return y(d.y);
      })
      .attr("transform", function (d) {
          return "rotate(" + computeTextRotation(d) + ")";
      })


    draw(data.filter(function(d) {return d}), depth);
  }

  function getData(query) {
    var rootElem = d3.select('.pie-elem path');
    
    if(!rootElem.empty())
      changeLevelWithoutTransition();

    d3.xhr('/data?'+query, function(err, data) {
      update(JSON.parse(data.responseText));
    });
  };

  function initTooltip() {
    tooltip = d3.select('svg').append('g')
      .attr('opacity', 0)
      .classed('tooltip', true);

    tooltip.append('text').classed('value-text', true).attr('dy', -15);
    tooltip.append('text').classed('label-text', true).attr('dy', -30);
  }

  initGraph();
  getData('');
  initTooltip();

  graphApi.update = getData;
}