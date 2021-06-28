// NOTE: using fetch and parseRows because csv.parse does not
// work with Content Security Policy — see https://github.com/d3/d3-dsv#content-security-policy

const drawChart = async () => {
    // TODO: will need to load data by absolute path so it will resolve when embedded
    // e.g. from S&co map
    //   rawcsv = await d3.text("https://princeton-cdh.github.io/literary-right-bank/data.csv");
    var rawcsv = await d3.text("docs_attention_people.csv");
    // remove header row
    var content = rawcsv.substring(rawcsv.indexOf("\n") + 1)
    var data = d3.csvParseRows(content, function (d, i) {
        return {
            // ,pgpid,count,people
            // hardcode mapping for simplicity; could use header row if desired
            pgpid: d[1],
            count: d[2],
            people: d[3],
        };
    });



    var containerWidth = document.getElementById("viz-container").offsetWidth;

    console.log("container width = " + document.getElementById("viz-container").offsetWidth);

    var width = 1000;
    // var width = containerWidth;
    var height = 900;
    // var height = 2000;


    // build the chart
    const svg = d3.select('#viz-container')
        .append("svg")
        .attr("viewBox", [0, 0, width, height]);

    // layout pgp documents in a grid pattern
    // color intensity based on the number of people who have worked on that document
    const size = 4;  // 7 is a nice size...
    // const size = containerWidth / 50;
    // const size = 40;
    const margin = 0.5;
    const cols = 195;
    // const cols = containerWidth / 42;
    // const cols = 23;
    console.log('size ' + size + ' cols ' + cols);

    // when testing with smaller dataset
    // const size = 7;
    // const margin = 2;
    // const cols = 100;

    const color = d3.schemeBlues[9];

    const grid = svg.append("g")
        .attr('class', 'documents')
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d, i) => (i % cols) * (size + 2 * margin) + margin)
        .attr("y", (d, i) => Math.floor((i / cols)) * (size + 2 * margin) + margin)
        .attr("fill", d => color[d.count])
        .attr("id", d => 'pgpid-' + d.pgpid)
        .attr("data-contributor-count", d => d.count)
        .attr("class", d => d.people)
        .attr("width", size)
        .attr("height", size);

    // color legend
    var max_count = Math.max.apply(Math, data.map(function (o) { return o.count; }))

    const legend_svg = d3.select('#viz-container')
        .append("svg")
        .attr("viewBox", [0, 0, 150, 50])
        .attr("class", "color-legend");

    var ordinal = d3.scaleOrdinal()
        .domain(Array(max_count + 1).keys())
        .range(color);

    legend_svg.append("g")
        .attr("class", "legend");

    var legendOrdinal = d3.legendColor()
        // .shapeWidth(10)    // default size is 15x15
        // .shapeHeight(10)
        .labelOffset(5)
        .orient('horizontal')
        .scale(ordinal);

    legend_svg.select(".legend")
        .call(legendOrdinal);

    legend_svg.append("text")
        .text("Number of contributors")
        .attr("class", "title")
        .attr("x", 30)
        .attr("y", 45);






    // load list of top contributors
    // includes name, id, and count
    var people = fetch("contributors.json")
        .then(response => response.json())
        .then(response => contributorFilterMenu(response));

    function toggleContributorSelection(target) {
        // if not currently selected, select label and associated documents
        if (!d3.select(target).classed('selected')) {
            svg.classed("selection", true);
            // unselect all other labels and select this one
            d3.selectAll('.contributors li').classed('selected', false);
            d3.select(target).classed('selected', true);
            //d3.select('#' + d.target.id).classed('highlight', true);
            // unselect all documents, then select documents for this contributor
            d3.selectAll("rect").classed('highlight', false);
            d3.selectAll("rect." + target.id).classed('highlight', true);
        } else {
            // already selected; unselect everything
            svg.classed("selection", false);
            d3.selectAll('.contributors li').classed('selected', false);
            d3.selectAll("rect").classed('highlight', false);
        }
    }

    function contributorFilterMenu(people) {
        const contribList = d3.select('.contributors')
            .selectAll("li")
            .data(people)
            .join("li")
            .text(d => d.name)
            .attr('id', d => d.id)
            .on("click", d => {
                if (d.target.id) {
                    toggleContributorSelection(d.target);
                } else {
                    // if clicked on the span for the count, call on parent element
                    toggleContributorSelection(d.target.parentElement)
                }
            })
            .append('span')
            .attr('class', 'count')
            .text(d => " (" + d.count.toLocaleString() + ")")

    }

}

drawChart();