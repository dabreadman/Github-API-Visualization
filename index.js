const titleText = "Mutual Following Count";
const xAxisLabelText = "Count";

const svg = d3.select("svg");

const width = +svg.attr("width");
const height = +svg.attr("height");

const render = (data) => {
  const xValue = (d) => d["count"];
  const yValue = (d) => d.login;
  const margin = { top: 50, right: 40, bottom: 77, left: 180 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, xValue)])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleBand()
    .domain(data.map(yValue))
    .range([0, innerHeight])
    .padding(0.1);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xAxisTickFormat = (number) =>
    d3.format(".3s")(number).replace("G", "B");

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(xAxisTickFormat)
    .tickSize(-innerHeight);

  g.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll(".domain, .tick line")
    .remove();

  const xAxisG = g
    .append("g")
    .call(xAxis)
    .attr("transform", `translate(0,${innerHeight})`);

  xAxisG.select(".domain").remove();

  xAxisG
    .append("text")
    .attr("class", "axis-label")
    .attr("y", 65)
    .attr("x", innerWidth / 2)
    .attr("fill", "black")
    .text(xAxisLabelText);

  g.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", (d) => yScale(yValue(d)))
    .attr("width", (d) => xScale(xValue(d)))
    .attr("height", yScale.bandwidth());

  g.append("text").attr("class", "title").attr("y", -10).text(titleText);
};

const authObj = {
  headers: {
    Authorization: "token <token>",
  },
};

// Get bidirectional followings for a login
async function getDual(login) {
  try {
    const followers = await fetch(
      `https://api.github.com/users/${login}/followers`,
      authObj
    )
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
      });
    const followings = await fetch(
      `https://api.github.com/users/${login}/following`,
      authObj
    )
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
      });

    let duplicate = [];
    followers.forEach(function (follower) {
      followings.forEach(function (following) {
        if (follower.id === following.id) {
          duplicate.push(follower);
        }
      });
    });
    return duplicate;
  } catch (err) {
    console.log(err);
  }
}

// Get array of bidirectional followings for logins step of 1 from login, self-inclusive
async function getDualSpread(login) {
  try {
    let socialSpace = [login];
    const followers = await fetch(
      `https://api.github.com/users/${login}/followers`,
      authObj
    )
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
      });
    const following = await fetch(
      `https://api.github.com/users/${login}/following`,
      authObj
    )
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
      });

    followers.forEach((entry) => socialSpace.push(entry.login));
    following.forEach((entry) => socialSpace.push(entry.login));

    let dict = [];
    let uniqueLogins = [...new Set(socialSpace)];

    await Promise.all(
      uniqueLogins.map(async (login) => {
        const dups = await getDual(login);
        console.log(dups);
        dict.push({ login: login, count: dups.length });
        return;
      })
    );
    return dict;
  } catch (err) {
    console.log(err);
  }
}

getDualSpread("dabreadman").then((data) => {
  render(data);
});

