const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const authObj = {
  headers: {
    Authorization: "token ".concat(process.env.OAUTH),
  },
};

// // Return a list of login of login's followers that followed login
// async function getReFollower(login) {
//   const followers = await fetch(
//     `https://api.github.com/users/${login}/followers`,
//     authObj
//   )
//     .then((res) => (result = res.json()))
//     .catch((err) => {
//       console.log(err);
//     });

//   let reFollowers = [];
//   await Promise.all(
//     followers.map(async (entry) =>
//       fetch(entry.followers_url, authObj)
//         .then((res) => res.json())
//         .then((res) =>
//           res.forEach((followed) => {
//             if (followed.login === login) {
//               reFollowers.push(entry.login);
//             }
//           })
//         )
//         .catch((err) => {
//           console.log(entry);
//           console.log(err);
//         })
//     )
//   );

//   console.log(reFollowers);
//   return reFollowers;
// }

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

    const getDuals = async () => {
      uniqueLogins.forEach(async (login) => {
        const dups = await getDual(login);
        console.log(dups);
        dict.push({ login: login, entries: dups, count: dups.length });
      });
    };
    getDuals();
    return dict;
  } catch (err) {
    console.log(err);
  }
}

var apis = getDualSpread("dabreadman");
console.log(apis);

console.log("fin");
