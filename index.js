// Sort JSON by attribute
function sortJSON(json, attr) {
  json.sort(function (a, b) {
    return b[attr] - a[attr];
  });
  return json;
}

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

// Validate user data, return false if login or auth is invalid
async function validateUserData(login) {
  try {
    const repo = await fetch(`https://api.github.com/users/${login}`, authObj)
      .then((res) => (res.status === 200 ? true : false))
      .catch((err) => {
        console.log(err);
      });
    return repo;
  } catch (err) {
    console.log(err);
  }
}

// Get metrics of the social space of 1 from login
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
    const sortedMT = sortJSON(mutualFollowers, "count");
    const sortRepo = sortJSON(repos, "count");
    return [sortedMT, sortRepo];
  } catch (err) {
    console.log(err);
  }
}

// Removed rendered components
function update(target) {
  d3.selectAll(target).selectAll("*").remove();
}

// Renders horizontal bar charts with X and Y-axis in target pointed by CSS selector
// data[0]: Y-axis
// data[1]: X-axis
const render = (data, selector, titleText, xAxisText, prefix, linkprefix) => {
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
    .attr("id", (data) => `${prefix}:${Object.values(data)[0]}`)
    .attr("y", (d) => yScale(yValue(d)))
    .attr("width", (d) => xScale(xValue(d)))
    .attr("height", yScale.bandwidth())
    .attr("value", (d) => d.count)
    .attr(
      "onclick",
      (data) =>
        `window.open('https://github.com/${
          Object.values(data)[0]
        }${linkprefix}');`
    );

  g.append("text")
    .attr("class", "title")
    .attr("y", -10)
    .attr("id", prefix)
    .text(titleText);
};

function getRanking(json, login) {
  return (
    json.findIndex(function (item, i) {
      return item.login === login;
    }) + 1
  );
}

let authObj;
// Get data from Github API and renders visualization
const generateCharts = async (login, auth, data = []) => {
  // if no login or auth provided, generates sample labels
  if (data.length > 0) {
    render(
      data[0],
      "#table1",
      "Sample Title1",
      `Counts: Placed 0 at 0 sample metric 1`,
      "ex1",
      ""
    );
    render(
      data[1],
      "#table2",
      "Sample Title2",
      `Counts: Placed 0 at 0 sample metric 2`,
      "ex2",
      ""
    );
  } else {
    authObj = {
      headers: {
        Authorization: `token ${auth}`,
      },
    };
    validateUserData(login).then((res) => {
      if (!res) {
        document.getElementById("status").innerHTML =
          "Invalid Data, check input";
        initCharts();
      } else {
        document.getElementById("status").innerHTML =
          "Valid Username and Auth token";
        getLoginData(login).then((data) => {
          let ranking = getRanking(data[0], login);
          render(
            data[0],
            "#table1",
            "Mutual Following",
            `Counts: Placed ${ranking} at ${
              data[0][ranking - 1]["count"]
            } mutual followers`,
            "t1",
            ""
          );
          ranking = getRanking(data[1], login);
          render(
            data[1],
            "#table2",
            "Total Repositories",
            `Counts: Placed ${ranking} at ${
              data[1][ranking - 1]["count"]
            } repositories`,
            "t2",
            "?tab=repositories"
          );
        });
      }
    });
  }
  return;
};

// Listener for form submission
document.getElementById("submitBtn").onclick = function () {
  update("svg");
  try {
    generateCharts(
      document.getElementById("login").value,
      document.getElementById("authToken").value
    );
  } catch (err) {
    console.log(err);
  }
};

// Listener for bar coloring
document.getElementById("colorBtn").onclick = function () {
  const login = document.getElementById("login").value;
  clearBar();
  colorBar(login);
  const res = document.querySelectorAll(`[id$=${login}]`);
  res.forEach((entry) => {
    const prefix = entry.id.substring(0, entry.id.indexOf(":"));
    const textElement = document.getElementById(prefix);
    const res = entry.__data__;
    let previousText = textElement.textContent;
    const delimiterIndex = previousText.indexOf(":");
    if (delimiterIndex >= 0)
      previousText = previousText.substring(0, delimiterIndex);
    textElement.innerHTML = previousText.concat(`: ${res.count}`);
  });
};

// Colors bar of login
function colorBar(login) {
  const res = document.querySelectorAll(`[id$=${login}]`);
  res.forEach((ele) => ele.setAttribute("fill", "red"));
}

// Clears colored bar
function clearBar() {
  const res = document.querySelectorAll(`[fill="red"]`);
  res.forEach((ele) => ele.setAttribute("fill", "black"));
}

// Generates initial charts
function initCharts() {
  // Dummy data for initial chart generation
  const dummyData = [
    [
      {
        login: "ahmhly",
        count: 31,
      },
      {
        login: "daban",
        count: 25,
      },
      {
        login: "hry2",
        count: 24,
      },
      {
        login: "rivanum",
        count: 22,
      },
      {
        login: "kaprz",
        count: 20,
      },
      {
        login: "Amuman",
        count: 20,
      },
      {
        login: "le2jan",
        count: 19,
      },
      {
        login: "enbrrton",
        count: 14,
      },
      {
        login: "Keeyo",
        count: 14,
      },
      {
        login: "Hu99",
        count: 13,
      },
      {
        login: "Daugent",
        count: 13,
      },
      {
        login: "xily",
        count: 11,
      },
      {
        login: "dana5",
        count: 10,
      },
      {
        login: "Myikub",
        count: 8,
      },
      {
        login: "Breanobus",
        count: 6,
      },
      {
        login: "Sekt",
        count: 6,
      },
      {
        login: "AlonXD",
        count: 5,
      },
      {
        login: "barb8",
        count: 3,
      },
      {
        login: "dev2nz",
        count: 2,
      },
      {
        login: "mett-h1",
        count: 1,
      },
    ],
    [
      {
        login: "Daugent",
        count: 13,
      },
      {
        login: "xily",
        count: 11,
      },
      {
        login: "dana5",
        count: 10,
      },
      {
        login: "le2jan",
        count: 9,
      },
      {
        login: "Myikub",
        count: 8,
      },
      {
        login: "Breanobus",
        count: 6,
      },
      {
        login: "Sekt",
        count: 6,
      },
      {
        login: "AlonXD",
        count: 5,
      },
      {
        login: "enbrrton",
        count: 4,
      },
      {
        login: "hry2",
        count: 4,
      },
      {
        login: "Keeyo",
        count: 4,
      },
      {
        login: "barb8",
        count: 3,
      },
      {
        login: "ahmhly",
        count: 3,
      },
      {
        login: "Hu99",
        count: 3,
      },
      {
        login: "daban",
        count: 2,
      },
      {
        login: "kaprz",
        count: 2,
      },
      {
        login: "rivanum",
        count: 2,
      },
      {
        login: "Amuman",
        count: 2,
      },
      {
        login: "dev2nz",
        count: 2,
      },
      {
        login: "mett-h1",
        count: 1,
      },
    ],
  ];
  generateCharts("", "", dummyData);
}

initCharts();
