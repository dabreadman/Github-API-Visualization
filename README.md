# Github-API-Visualization
Access [Github API](https://docs.github.com/en/free-pro-team@latest/rest/guides/getting-started-with-the-rest-api) and visualize data using [D3.js](https://d3js.org/) written with [Javascript](https://www.javascript.com/).  
Access webpage [here](https://dabreadman.github.io) 

Data shown:
- Mutual following ranking in social space of 1
- Repository count ranking in social space of 1
# Use 
1.  Clone this [repo](https://github.com/dabreadman/Github-API-Visualization) with 
`git clone https://github.com/dabreadman/Github-API-Visualization`
2. Open [`index.html`](https://github.com/dabreadman/Github-API-Visualization/blob/main/index.html) on any browser (Chrome, Firefox, etc).
3. Enter Github login, [personal access token](https://github.com/settings/tokens/new) (documentation [here](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)) and press submit.
4. Colors Bar button would highlight entered login and show data (relative ranking and value). 

Note: It would take ~8-20 seconds to render depending on metric size.
Only the first 500 entries of each login's followers, following, and repos will be taken, this would results in inaccurate metric especially mutual followers if a login exceeded that constrain. 

Forked from [curran](https://github.com/curran/dataviz-course-2018)
