// Renders horizontal bar charts with X and Y-axis in target pointed by CSS selector
// data[0]: Y-axis
// data[1]: X-axis
const render = (data, selector, titleText, xAxisText, prefix) => {
  const svg = d3.select(selector);
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const xValue = (d) => Object.values(d)[1];
  const yValue = (d) => Object.values(d)[0];
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
    .text(xAxisText);

  g.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .text((data) => `${prefix}:${Object.values(data)[0]}`)
    .attr("y", (d) => yScale(yValue(d)))
    .attr("width", (d) => xScale(xValue(d)))
    .attr("height", yScale.bandwidth())
    .attr(
      "onclick",
      (data) => `window.open('https://github.com/${Object.values(data)[0]}');`
    );

  g.append("text").attr("class", "title").attr("y", -10).text(titleText);
};

// Fetch data from Github API by attribute
async function getAPIData(login, attribute, pageLimit = 5, perPage = 100) {
  try {
    const attrs = [];
    let done = false;
    for (let page = 1; page <= pageLimit && !done; page++) {
      await fetch(
        `https://api.github.com/users/${login}/${attribute}?page=${page}&per_page=${perPage}`,
        authObj
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.length > 0) {
            attrs.push(...res);
            if (res.length < 100) {
              done = true;
            }
          } else {
            done = true;
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return attrs;
  } catch (err) {
    console.log(err);
  }
}

// Get mutual followings for a login
async function getMutual(login) {
  try {
    const followers = await getAPIData(login, "followers");
    const followings = await getAPIData(login, "following");

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

// Validate user login, return false if login invalid
async function validateUserName(login) {
  try {
    const repo = await fetch(`https://api.github.com/users/${login}`, authObj)
      .then((res) => res.json())
      .then((res) => (res.message === "Not Found" ? false : true))
      .catch((err) => {
        console.log(err);
      });
    return repo;
  } catch (err) {
    console.log(err);
  }
}

// Get array of bidirectional followings for logins step of 1 from login, self-inclusive
async function getLoginData(login) {
  try {
    let socialSpace = [login];
    const followers = await getAPIData(login, "followers");
    const followings = await getAPIData(login, "following");

    // Get unique logins social space of 1
    followers.forEach((entry) => socialSpace.push(entry.login));
    followings.forEach((entry) => socialSpace.push(entry.login));
    let uniqueLogins = [...new Set(socialSpace)];

    // Push mutual followings into a dictionary
    let mutualFollowers = [];
    await Promise.all(
      uniqueLogins.map(async (login) => {
        const dups = await getMutual(login);
        mutualFollowers.push({ login: login, count: dups.length });
      })
    );

    // Push repo counts into a dictionary
    let repos = [];
    await Promise.all(
      uniqueLogins.map(async (login) => {
        const repo = await getAPIData(login, "repos");
        repos.push({ login: login, count: repo.length });
      })
    );

    return [mutualFollowers, repos];
  } catch (err) {
    console.log(err);
  }
}

let authObj;
// Get data from Github API and renders visualization
const generateCharts = async (login, auth) => {
  authObj = {
    headers: {
      Authorization: `token ${auth}`,
    },
  };
  validateUserName(login).then((res) => {
    if (!res) {
      document.getElementById("error").innerHTML = "Error";
    } else {
      document.getElementById("error").innerHTML = "Loading!";
      getLoginData(login).then((data) => {
        render(data[0], "#table1", "Mutual Following", "Counts", "t1");
        render(data[1], "#table2", "Total Repositories", "Count", "t2");
      });
    }
  });
};

// Removed rendered components
const update = (target) => {
  d3.selectAll(target).selectAll("*").remove();
};

// Listener for submit button and kick off visualization
let search = document.getElementById("credentials");
if (search) {
  search.addEventListener("submit", (ref) => {
    ref.preventDefault();
    update("svg");
    try {
      generateCharts(
        document.getElementById("login").value,
        document.getElementById("authToken").value
      );
    } catch {
      console.log("something");
    }
  });
}
