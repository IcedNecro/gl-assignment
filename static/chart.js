var graphApi = {} 

graphApi.getData = function(query, callback) {
  d3.xhr('/data?'+query, callback)
};

window.onload = function() {

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

  function draw(err, data) {

    // receiving data
    var root = JSON.parse(data.responseText);

    // receiving depth
    var depth = getDepth(root);

    var width = 500,
        height = 500,
        radius = Math.min(width, height) / 2;

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.sqrt()
        .range([0, radius]);

    var color = d3.scale.category10();

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ") rotate(-90 0 0)");

    var partition = d3.layout.partition()
        .value(function (d) {
            return d.value;
        });

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

    var g = svg.selectAll("g")
        .data(partition.nodes(root))
        .enter().append("g");

    var path = g.append("path")
        .attr("d", arc)
        .style("fill", function (d) {
            return color((d.children ? d : d.parent).name);
        })
        .on("click", click);

    //.append("text")
    var text = g.append("text")
        .attr("x", function (d) {
        return y(d.y);
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

    function computeTextRotation(d) {
        var angle = x(d.x + d.dx / 2) - Math.PI / 2;
        return angle / Math.PI * 180;
    }

    function click(d) {
        // fade out all text elements
        if(d.value !== undefined) {
            d.value += 100;
        };
        text.transition().attr("opacity", 0);

        path.transition()
            .duration(750)
            .attrTween("d", arcTween(d))
            .each("end", function (e, i) {
            // check if the animated element's data e lies within the visible angle span given in d
            if (e.x >= d.x && e.x < (d.x + d.dx)) {
                // get a selection of the associated text element
                var arcText = d3.select(this.parentNode).select("text");
                // fade in the text element and recalculate positions
                arcText.transition().duration(750)
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
    // Interpolate the scales!
    function arcTween(d) {
        var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        return function (d, i) {
            return i ? function (t) {
                return arc(d);
            } : function (t) {
                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
                return arc(d);
            };
        };
    }
  }


  graphApi.getData('', draw);
}