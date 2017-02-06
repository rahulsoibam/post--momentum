/*
  Render an overlay layer
*/
function renderOverlay(svg, nodes) {

//    console.log(outdiv.node().offsetLeft, outdiv.node().offsetTop)

  var ringPath = ringPathGen(5, 0, 0)

  var updates = []

  for (var i = 0; i < 5; i++) {

    var adjust = [0,0,-10,-40,-20][i]
    var x1 = nodes[i].offsetLeft + 20
    var y1 = nodes[i].offsetTop + adjust

    var line = svg.append("line")
      .style("stroke", "grey")
      .style("stroke-width", "1px")
      .attr("stroke-dasharray", "5,3")
      .attr("opacity", 0.7)    
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x1)
      .attr("y2", y1 - adjust)

    var path = svg.append("path")
                  .attr("d", ringPath([110,110],[x1,y1]).d)
                  .style("stroke", "grey")
                  .style("stroke-width", "1px")
                  .style("fill", "none")
                  .attr("stroke-dasharray", "5,3")
                  .attr("opacity", 0.7)

    var circ = svg.append("circle")
     .attr("r", 5).attr("cx", x1).attr("cy",y1).attr("fill","none").attr("stroke", "black").attr("stroke-width", "1px")
    
    var updatePath =  (function(xin, yin, pathin, circin,i, aline) {
      return function(x2, y2, bold) {
        circin.attr("cx", x2).attr("cy", y2).attr("stroke-width", bold? 2 : 1).attr("stroke", colorbrewer.Dark2[5][i])
        if (i <2) {
          pathin.attr("d", ringPath([x2, y2],[xin, yin]).d).attr("opacity", bold? 1 : 0.7).style("stroke-width", bold? 2:1).style("stroke", colorbrewer.Dark2[5][i])
        } else {
          pathin.attr("d", ringPath([xin, yin],[x2, y2]).d).attr("opacity", bold? 1 : 0.7).style("stroke-width", bold? 2:1).style("stroke", colorbrewer.Dark2[5][i])
        }
        aline.attr("opacity", bold? 1 : 0.7).style("stroke-width", bold? 2:1).style("stroke", colorbrewer.Dark2[5][i]) 
      }
    })(x1, y1, path, circ,i,line)

    updates.push(updatePath)
  } 

  return updates
}

/*
  Render the whole momentum widget
*/
function renderTaxonomy(div) {

  var valueline = d3.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; });

  function drawPath(svg, s1, s2, e1, e2) {

    svg.append("path")
        .attr("opacity", 1)
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("stroke-linecap","round")
        .attr("d", genPath( s1, s2, e1, e2 ))

  }

  var num_iters = 40

  function getTrace(alpha, beta, xy, coord) {
    var m = []
    var lambda = [1,100]
    var iter = geniterMomentum([[1, 0],[0, 1]], lambda, lambda, alpha, beta)
    // run for 500 iterations
    for (var i = 0; i <= num_iters; i++) { 
      if (xy == 1) {  m.push(numeric.add(iter(i)[xy],-1)) }
      if (xy == 0) {  m.push(numeric.mul(iter(i)[xy],0.005)) }
    }
    return numeric.transpose(m)[coord]
  }

  div.style("display", "block")
     .style("margin-left","auto")
     .style("margin-right","auto")
     .style("position", "relative")
     .style("border-radius", "5px")
      .on("click", function () { console.log(d3.mouse(this)) })

  var divs = []
  function genPhase(i,t,l, range,title,text) {

    var outdiv = div.append("div")
                .style("position", "absolute")
                .style("top", t +"px")
                .style("left", l +"px")
                .style("width", "180px")
                .style("height", "300px")
                .style("border-top", "2px solid " + colorbrewer.Dark2[5][i])

    divs.push(outdiv.node())

    var updatePath = stemGraphGen(170, 120, num_iters)
                        .radius1(1)
                        .axis(range)
                        .labelSize("0px")
                        .numTicks(2)
                        .borderTop(30)
                        (outdiv)

    outdiv.append("span")
      .style("position", "absolute")
      .style("top","5px")
      .style("left", "10px")
      .style("width", "150px")
      .style("height", "130px")
      .style("font-size", "13px")
      .attr("class", "figtext")
      .style("text-align", "left")                
      .html("<b>"+title+"</b>")

    outdiv.append("figcaption")
      .style("position", "absolute")
      .style("top","160px")
      .style("left", "10px")
      .style("width", "150px")
      .style("height", "130px")
      .attr("class", "figtext2")      
      .style("color", "gray")
      .style("text-align", "left")                
      .html(text)


    return updatePath
  }

  var top = 270
  var spacing = 190
  var updateDR = genPhase(0,top,0, [-1.4,1.4], "Ripples", "R's eigenvalues are complex, have norm $\\leq 1$. $0 \\leq \\alpha \\leq 2/\\lambda_i$. The iterates display low frequency ripples as they spiral to 0.")
  updateDR(getTrace(0.0017,0.94,1,1))

  var updateMC = genPhase(1,top,spacing*1,[-1.4,1.4], "Monotonic Decrease", "R's eigenvalues are both real, are positive, and have norm less than one. The behavior here resembles gradient descent.")
  updateMC(getTrace(0.00093, 0.16,1,1))

  var updateD = genPhase(2,top,spacing*2,[-1.4,1.4], "1-Step Convergence", "When $\\alpha = 1/\\lambda_i$, and $\\beta = 0$, we converge in one step. This is a very special point, and kills the error in the eigenspace completely.")
  updateD(getTrace(0.0213, 0.06,1,1))

  var updateIC = genPhase(3,top,spacing*3,[-1.4,1.4], "Monotonic Oscillations", "When $\\alpha > 1/\\lambda_i$, the sign of the term in the power is negative. The iterates flip between $+$ and $-$ at each iteration.")
  updateIC(getTrace(0.01, 0.0001,1,1))

  var updateMO = genPhase(4,top,spacing*4,[-5,5], "Divergence", "When $\\max\\{\\sigma_1,\\sigma_2\\} > 1$, the iterates diverge.")
  updateMO(getTrace(0.02, 0.045,1,1))

  var svg = div.append("svg")
              .style("position", "absolute")
              .style("width","920px")
              .style("height","500px")
              .style("z-index", 3)
              .style("pointer-events","none")

  function wrap(f) {
    return function(alpha, beta) {
      return f(getTrace(alpha, beta, 1,1))
    }
  }

  return {update:[wrap(updateDR), wrap(updateMC), wrap(updateD), wrap(updateIC), wrap(updateMO)], div:divs }
}

/*
  Render 2D slider thingy to the right.
*/
function render2DSliderGen(updateDR, updateMC, updateIC, updateMO, updateD, 
                           defaults) {

  var slider2Dtop = 10           // Margin at top
  var slider2D_size = 200;        // Dimensions (square) of 2D Slider
  var slider2Dleft = 0  // How far to the left to put the 2D Slider

  function render2DSlider(divin){

    function getEigs(alpha, beta,lambda) {
      var E = [[ beta          , lambda          ], 
              [ -1*alpha*beta , 1 - alpha*lambda]]
      return numeric.eig(E)["lambda"]
    }

    var div = divin
      .append("div")
      .style("position","absolute")
      .attr("class", "d3-tip n")
      .style("z-index", 2)
      .html("s1 = <br> s2 = <br> complex")
      .style("opacity",0)

    var ybeta  = d3.scaleLinear().domain([1,0]).range([0, slider2D_size]);
    var xalpha = d3.scaleLinear().domain([0,4/100]).range([0, 2*slider2D_size]);

    var prevregime = ""
    var canvas = divin
      .append('canvas')
        .style("position", 'absolute')
        .style("left", 137 + "px")
        .style("top", slider2Dtop + "px")
        .style("width", 2*slider2D_size)
        .style("height", slider2D_size)
        .attr("width", 2*slider2D_size/1)
        .attr("height", slider2D_size/1)
        .style("z-index", 1)
        .style("border","solid 1px black")
        // .style("box-shadow","0px 3px 10px rgba(0, 0, 0, 0.4)")
        .on("mousemove", function() {

          var pt = d3.mouse(this)

          var alpha = Math.max(0,xalpha.invert(pt[0]))
          var beta  = ybeta.invert(pt[1])  	

          var xy = convert(alpha, beta)

          xAxis.select("circle").attr("cx", pt[0])      
          yAxis.select("circle").attr("cy", pt[1])
          
          var e = getEigs(alpha,beta, 100)
          var n1 = 0
          var n2 = 0
          var regime = ""
          var regime2 = "convergent"
          if (e.y === undefined) {
            n1 = Math.abs(e.x[0])
            n2 = Math.abs(e.x[1])
            regime = "real"
          } else {
            n1 = numeric.norm2(e.x[0], e.y[0])    
            n2 = numeric.norm2(e.x[1], e.y[1]) 
            regime = "complex"               
          }

          if (Math.max(n1,n2) < 1.0001) {
            regime2 = "convergent"
          } else {
            regime2 = "divergent"
          }

          if (alpha < 1/100) {
            regime3 = "short"
          } else if (alpha < 2/100) {
            regime3 = "long"
          } else {
            regime3 = "verylong"
          }

          if (regime == "real" && regime3 != "short" && regime2 != "divergent") {
            if (prevregime != "MO") {
              updateDR(defaults[0][0], defaults[0][1], false)
              updateMC(defaults[1][0], defaults[1][1], false)
              updateIC(defaults[2][0], defaults[2][1], false)
              updateD( defaults[4][0], defaults[4][1], false)
            }
            updateMO(alpha,beta, true)
            prevregime = "MO"
          }

          if (regime == "real" && regime3 == "short") {
            if (prevregime != "MC") {
              updateDR(defaults[0][0], defaults[0][1], false)
              updateIC(defaults[2][0], defaults[2][1], false)
              updateMO(defaults[3][0], defaults[3][1], false)
              updateD( defaults[4][0], defaults[4][1], false)
            }
            updateMC(alpha,beta, true)
            prevregime = "MC"
          }

          if (regime == "complex") {
            if (prevregime != "DR") {
              updateMC(defaults[1][0], defaults[1][1], false)
              updateIC(defaults[2][0], defaults[2][1], false)
              updateMO(defaults[3][0], defaults[3][1], false)
              updateD( defaults[4][0], defaults[4][1], false)
            }
            updateDR(alpha,beta, true)
            prevregime = "DR"
          }

          if (regime2 == "divergent") {
            if (prevregime != "D") {
              updateDR(defaults[0][0], defaults[0][1], false)
              updateMC(defaults[1][0], defaults[1][1], false)
              updateIC(defaults[2][0], defaults[2][1], false)
              updateMO(defaults[3][0], defaults[3][1], false)
            }
            updateD(alpha,beta, true)
            prevregime = "D"
          }

        }).on("mouseout", function() {
            updateDR(defaults[0][0], defaults[0][1], false)
            updateMC(defaults[1][0], defaults[1][1], false)
            updateIC(defaults[2][0], defaults[2][1], false)
            updateMO(defaults[3][0], defaults[3][1], false)
            updateD( defaults[4][0], defaults[4][1], false)
        }


        )
        .node();

    var convert = function(alpha, beta) {
      return [xalpha(alpha) + canvas.offsetLeft + divin.node().offsetLeft, 
              ybeta(beta) + canvas.offsetTop  + divin.node().offsetTop]
    }

    renderHeatmap(canvas, function(i,j) { 
      var e = getEigs(4*i,1-j, 1)
      return Math.max(e.getRow(0).norm2(), e.getRow(1).norm2()); 
    }, d3.scaleLinear().domain([0,0.3,0.5,0.7,1,1.01]).range(colorbrewer.Blues[5].concat(["black"])))

    // /* Axis */
    var canvasaxis = divin.append("svg").style("z-index", 0)
      .style("position","absolute")
      .style("left","86px")
      .style("top", (-20 + slider2Dtop) +  "px")
      .style("width",2*slider2D_size + 70)
      .style("height",slider2D_size + 60)

    var xAxis = canvasaxis.append("g")
    xAxis.append("circle").attr("fill", "black").attr("r", 2)
    xAxis.attr("class", "grid figtext")
      .attr("transform", "translate(51,"+(slider2D_size + 25) +")")  
      .call(d3.axisBottom(d3.scaleLinear().domain([0,4]).range([0, 2*slider2D_size]))
          .ticks(2)
          .tickSize(4))

    var yAxis = canvasaxis.append("g")
    yAxis.append("circle").style("fill", "black").attr("r", 2)
    yAxis.attr("class", "grid figtext")
      .attr("transform", "translate(46,20)")
      .call(d3.axisLeft(ybeta).ticks(1).tickSize(4))


    var html = katex.renderToString("\\beta=")
    divin
      .append("text")
      .style("position","absolute")
      .style("left", "23px")
      .style("width", "90px")
      .style("top", slider2Dtop -9 + "px")
      .attr("class", "figtext")
      .html("Momentum " + html)

    var html = katex.renderToString("\\alpha=")
    divin
      .append("text")
      .style("position","absolute")
      .style("left", "440px")
      .style("width", "90px")
      .style("top", slider2Dtop + 208 + "px")
      .attr("class", "figtext")
      .html("Steplength " + html)

    // Returns a function which converts alpha, beta into the parents
    // coordinate space
    return convert

  }

  render2DSlider.size = function (_) {
    slider2D_size = _; return render2DSlider
  }

  return render2DSlider
}