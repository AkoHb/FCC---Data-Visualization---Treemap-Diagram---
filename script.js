// create config variables and constants
const DEFAULT_CONFIG = {
    ERROR_NAME: "[ERROR]: Name isn't available",
    ERROR_TITLE: "[ERROR]: Title isn't available",
    ERROR_DESCRIPTION: "[ERROR]: Description isn't available",
    ERROR_LINK: "[ERROR]: Invalid URL or the link contains invalid characters",
    ERROR_LOADING: (err="") => `[ERROR]: Something went wrong while loading the data. Please try again later.\n${err}`,
    ERROR_EMPTY: (variable = "") => `[ERROR]: The ${variable.toUpperCase()} is empty. No valid data available for further processing.`,
    ERROR_VALUE: (value="") => `[ERROR]: The ${value.toUpperCase()} is invalid. Please try to do it again`,
    ERROR_CELL_COLOR: 'lightgreen', // color to svg cell if color is invalid
    DEFAULT_BUTTON_NAME: (nameOrId="") => `Button ${nameOrId}`,
    DEFAULT_JSON_KEY: 'videogames',   // default key to object with valid data to show it on first loading
    DEFAULT_REM_SIZE: 16,             // default value 16px to rem
    DEFAULT_SUCCESS_MSG: (funcName="unnamed function") => `[INFO]: The ${funcName.toUpperCase()} completed successfully.` // when the function completed successfully (pass it the func name)
};

let appSettings = {
    lastSelectedKey: null,            // hold the value, user select by press button
    headerButtonTextSize: '2rem',   // buttons text size in head section to choose valid data 
    sizes: [
        '80%',                      // percentage of full width to svg 
        '90%'                       // percentage of full height to svg 
    ],                              // might be in px, rem, em, perc or zero to use only margin and pagging 
    width: null,                    // full window width, that we grabbed from html
    height: null,                   // full window height, that we grabbed from html
    remSize: null,                  // this value will update after loading the page
    margin: [0, 0, 0, 0],           // margin is might be px, rem, em and etc.
    padding: [0, 0, 0, 0],          // pading is might be px, rem, em and etc.
    svgW: null,                     // svg width with corrections like sizes
    svgH: null,                     // svg height with corrections like sizes
    paddingInner: 1,                // padding between cells into svg
    toolbarWidth: '2rem',           // toolbar width is might be px, rem, em and etc.
    toolbarHeight: '1rem',          // toolbar height is might be px, rem, em and etc.
    rangeColorsForGradient: [
        '#FA00F0',                  // values from 0 to min values (pink)
        '#DE330D',                  // red
        '#EBE700',                  // yellow
        '#08B000',                  // green
        '#00DFFA'                   // values higher max value (azure)
    ],
    rangeColors: [],                // here must be hold all colors to legend and filling the svg cell
    treemapName: "",                // that name was updated, when the json file seccessfully loading and has property "name"
    legend: {
        offset: null,
        rect_size: null,
        h_spacing: null,
        w_spacing: null,
        text_x_offset: null,
        text_y_offset: null
    }
};

/* 
    Into datasets holds the valid information about fields:
    * buttonName - if the button name is equal to empty string, it was named by defauld name using counts
                    and after loading the data, it will update to name similar to obj.name state
                    if it named by user, it will be used in priority 

    * title - document name in the head section with id=title
    * descriprion - document name in the head section with id=description
    * link - valid url to json file
*/

// data set with descriptions and file links 
const DATASETS = {
    videogames : {
        buttonName: "Video Game Data Set",
        title: 'Video Game Sales',
        description: 'Top 100 Most Sold Video Games Grouped by Platform',
        link:
        'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json'
    },
    movies : {
        buttonName: "Movies Data Set",
        title: 'Movie Sales',
        description: 'Top 100 Highest Grossing Movies Grouped By Genre',
        link:
        'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json'
    },
    kickstarter : {
        buttonName: "Kickstarter Data Set",
        title: 'Kickstarter Pledges',
        description:
        'Top 100 Most Pledged Kickstarter Campaigns Grouped By Category',
        link:
        'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json'
    }
};

// Update project name at first load
const projectName = 'Treemap Diagram';
document.title = projectName;

let svg;
let tooltip;

/*  
 * The `updateBody` function is used to update the page DOM during the first load.  
 *  
 * This function:  
 * - Adds header, main, and footer sections.  
 * - Creates headers with title and description inside the main section.  
 * - Adds a `div` container to hold the SVG, legend, and tooltip.  
 * - Updates some element style settings.  
 * - It is only executed once when the page loads.  
 */
const updateBody = () => {
    let body = document.body;
    
    // Add footer section for links and project information
    body.prepend(document.createElement('footer'));

    // Add main section for title, description, and SVG container  
    body.prepend(document.createElement('main'));

    // Add header section for user selection buttons  
    body.prepend(document.createElement('header'));
    
    let main = document.querySelector('main');
    main.appendChild(document.createElement('h1')).setAttribute('id', 'title');
    main.appendChild(document.createElement('h3')).setAttribute('id', 'description');
    main.appendChild(document.createElement('div')).setAttribute('id', 'container');

    let container = document.querySelector('#container');
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.flexDirection = 'column';

    // Create the SVG and tooltip using D3  
    svg = d3
        .select('#container')
        .append('svg')
        .attr('id', 'treemap');

    tooltip = d3
        .select('#container')
        .append('div')
        .attr('id', 'tooltip')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    return {
        success: true,
        message: DEFAULT_CONFIG.DEFAULT_SUCCESS_MSG('update body'),
    };
};

/**
 * The `getSize` function calculates a valid size based on the original size and the correlation value.
 *
 * @param {number} original - The base size to calculate the new value.
 * @param {String|number} correlation - The correlation value to calculate the new size. 
 *  - If it's a string like '5rem' or '15%', it will be parsed and calculated.
 *  - It will also handle 'rem' and '%' properly.
 * 
 * This function:
 * - Validates the input sizes.
 * - Calculates the size using the `rem` or `%` units.
 * - If no valid calculation can be made, it returns 0.
 * - If the correlation is a positive numeric value, it returns that number.
 * 
 * @returns {number} - The calculated size.
 */
const getSize = (original, correlation) => {
    // Check if original or correlation is invalid
    if (!original || !correlation) return 0;

    let size = 0;

    // Handle 'rem' calculation
    if (typeof correlation === 'string' && correlation.includes('rem')) {
        size = Number(correlation.split('rem')[0]);
        return Math.floor(appSettings.remSize * size);

    // Handle '%' calculation
    } else if (typeof correlation === 'string' && correlation.includes('%')) {
        size = Number(correlation.split('%')[0]);
        return Math.floor(original * size / 100);
    
    // If no units are used, return the numeric value or zero
    } else {
        return isNaN(Number(correlation)) ? 0 : Number(correlation);
    }
};


/**
 * The `parseData` function used to get a fetch with passed key
 * 
 * @param {String} Key - The key from the `appSettings` state
 * - if the "lastSelectedKey" valid, get it
 * - else, use default value based into `DEFAULT_CONFIG`
 * 
 * The function:
 * - try to processing data
 * - catch the errors
*/
const parseData = () => {

    let key = appSettings.lastSelectedKey ? appSettings.lastSelectedKey : DEFAULT_CONFIG.DEFAULT_JSON_KEY;

    d3.json(DATASETS[key].link)
        .then(data => processingData(data))
        .catch(err => console.debug(DEFAULT_CONFIG.ERROR_LOADING(err)));
};

/**  
 * The `selectCategory` function updates the state of the processed data file  
 * for the SVG treemap visualization.  
 *  
 * @param {string|Event} e - The category key selected by the user via a button click,  
 * or the default key from `DEFAULT_CONFIG.DEFAULT_JSON_KEY` when the page first loads.  
 *  
 * This function:  
 *  - Updates the title and description headers in the main section.  
 *  - Loads default text if the dataset lacks valid keys for headers.  
 *  - Stops processing and displays an error message if the dataset lacks a valid link.  
 */
const selectCategory = (e = DEFAULT_CONFIG.DEFAULT_JSON_KEY) => {

    let key = e === DEFAULT_CONFIG.DEFAULT_JSON_KEY 
        ? DEFAULT_CONFIG.DEFAULT_JSON_KEY 
        : e;
    console.debug(`[INFO]: The category '${key}' was loaded using ${e.target ? 'selected' : 'default'} value.`);

    if (!DATASETS[key]) {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_EMPTY(`DATASETS -> ${key}`),
        };
    }
    
    // Extract dataset to avoid repetitive lookups
    const dataset = DATASETS[key] || {};
    const title = document.querySelector('#title');
    const descr = document.querySelector('#description');

    title.textContent = dataset.title || DEFAULT_CONFIG.ERROR_TITLE;
    descr.textContent = dataset.description || DEFAULT_CONFIG.ERROR_DESCRIPTION;
    
    if (!dataset.title || !dataset.description) {
        console.debug("[INFO]: Some of the headers were loaded with default values.");
    }

    if (!dataset.link) {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_EMPTY(`DATASETS -> ${key} hasn't a valid URL link`),
        };
    }

    appSettings.lastSelectedKey = key;
    // console.debug(appSettings);
    updateConfig();
    parseData();

    return {
        success: true,
        message: DEFAULT_CONFIG.DEFAULT_SUCCESS_MSG('select category'),
    };
};


/** 
 * The `createButtons` - The function, used to add the buttons to header section 
 * 
 * @param {Object} - hold valid info about JSON file and field names
 * 
 * The function:
 * - check that dataset isn't empty
 * - if not empty, add buttons user choice the valid JSON file
 * - if empty - show the message and stop the app.
 * - It is only executed once when the page loads.  
*/
const createButtons = dataset => {

    const dataKeys = Object.keys(dataset);

    if (dataKeys.length) {
        dataKeys.map(key => {
            document
                .querySelector('header')
                .appendChild(document.createElement('button'))
                .setAttribute('id', key);
            let button = document.querySelector(`#${key}`);
            button.setAttribute('value', key);
            button.setAttribute('type', 'button');
            button.textContent = dataset[key].buttonName;
            button.onclick = () => selectCategory(key);
        });
        selectCategory();
    } else {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_EMPTY(`DATASET to createButtons func`),
        };
    };
}

/** 
* The `updateConfig` function update the current values
* 
* The function:
* - get current width and height of loaded page
* - get rem size from body or set DEFAULT_CONFIG.DEFAULT_REM_SIZE
* - calculate the current svg sizes (width, height) 
* - check if if valid, update the svg attribute
* - calculate and update margin 
*/
const updateConfig = () => {
    // get current windo sizes
    const [width, height] = [self.innerWidth, self.innerHeight];

    // update rem size into settings or will use the default rem value
    appSettings.remSize =  parseFloat(window.getComputedStyle(document.querySelector('body'), null)
        .getPropertyValue('font-size')) || DEFAULT_CONFIG.DEFAULT_REM_SIZE;

    // calculate new values for svg
    let updSvgW = Math.max(0, getSize(width, appSettings.sizes[0]));
    let updSvgH = Math.max(0, getSize(height, appSettings.sizes[1]));

    // check if it valid
    if (updSvgW > 0 && updSvgH > 0) {
        svg.attr('width', updSvgW);
        svg.attr('height', updSvgH);
    } else {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_VALUE(`svgW or SvgH`),
        };
    }

    // update the same settings
    appSettings = {
        ...appSettings,
        svgW : updSvgW,
        svgH : updSvgH,
        width : width,
        height : height
    };

    let updatedMargin = [...appSettings.margin];

    updatedMargin[0] = Math.max(0, Math.floor((appSettings.height - appSettings.svgH - appSettings.padding[0]) / 2));
    updatedMargin[1] = Math.max(0, Math.floor((appSettings.width - appSettings.svgW - appSettings.padding[1]) / 2));
    updatedMargin[2] = Math.max(0, appSettings.height - appSettings.svgH - appSettings.padding[2]);
    updatedMargin[3] = Math.max(0, appSettings.width - appSettings.svgW - appSettings.padding[3]);

    appSettings.margin = updatedMargin;
    // console.log(`Updated appSettings looks like: ${appSettings}`)
    
    // update the legend sizes
    appSettings.legend = {
        offset: Math.floor(appSettings.remSize / 2),
        rect_size: appSettings.remSize,
        h_spacing: appSettings.remSize * 10,
        w_spacing: Math.floor(appSettings.remSize / 2),
        text_x_offset: Math.floor(appSettings.remSize / 5),
        text_y_offset: -Math.floor(appSettings.remSize / 5)
    };

    return {
        success: true,
        message: DEFAULT_CONFIG.DEFAULT_SUCCESS_MSG('update config')
    };
}; 


/**  
 * If `appSettings.rangeColors.length` is not equal to `dataLength`,  
 * a new color range needs to be generated.  
 *  
 * This function generates a valid color array based on the number of groups in the data file.  
 *  
 * @param {Array} data - Array with [category.name, category.value] JSON file,  
 * sorted from smallest to largest value.  
 * Colors are assigned within a range of 0% to 100% accordingly.  
 */
const generateColorRange = data => {

    // console.debug(data);
    if (!data.length || data.length <= 0) {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_EMPTY('Data for generateColorRange'),
        };
    }

    if (appSettings.rangeColorsForGradient.length <= 2) {
        return {
            success: false,
            message: "The rangeColorsForGradient doesn't have enough colors to generate the gradient.\nPlease check the appSettings.rangeColorsForGradient and try again.",
        };
    }

    // Create gradient and get valid colors for data keys
    const gradLength = appSettings.rangeColorsForGradient.length - 1;

    // Generate a gradient 
    const colorGradient = d3
        .scaleLinear()
        .domain(d3.range(0, 100, 100 / gradLength))
        .range(appSettings.rangeColorsForGradient)
        .interpolate(d3.interpolateRgb);

    // Map colors based on data length, fallback to default color if needed
    appSettings.rangeColors = d3
        .range(0, 100, 100 / (data.length))
        .map((point, i) => [data[i][0], colorGradient(point) || DEFAULT_CONFIG.ERROR_CELL_COLOR]);

    return {
        success: true,
        message: DEFAULT_CONFIG.DEFAULT_SUCCESS_MSG('generate color range'),
    };
};

/**
 * The `getCategories` function processes the data to extract category names and their max values.
 *
 * @param {Object} data - The object, passed after JSON fetch.
 * 
 * The function:
 * - Checks if the data is not empty.
 * - Iterates through the first-level children to find the max value of the 'value' key.
 * - Returns an array of [category.name, category.max.value] sorted by value.
 * 
 * @returns {Array} - An array of categories with [category.name, category.max.value].
 */
const getCategories = data => {
    if (!data || !Object.keys(data).length) {
        console.debug(DEFAULT_CONFIG.ERROR_EMPTY('data (getCategories function)'));
        return [];
    }

    let countNameError = 0;
    const defaultNameText = 'DefaultCategory';
    const defaultCategoryName = index => `${defaultNameText}${index}`;

    let categories = data.children.map(obj => {
        let maxValue = -Infinity; // Initialize to negative infinity to handle zero values
        let name = obj.name || defaultCategoryName(countNameError);

        if (!obj.children) {
            console.debug(DEFAULT_CONFIG.ERROR_EMPTY(`data.children.${name} (getCategories function)`));
        } else {
            obj.children.forEach(child => {
                let value = Number(child.value) || 0;
                maxValue = Math.max(maxValue, value); // Simplified comparison
            });
        }

        // Return [category name, max value]
        return [name, maxValue];
    });

    // Filter out default categories and sort by max value
    let filterCategories = categories.filter(array => !array[0].includes(defaultNameText));

    if (filterCategories.length) {
        filterCategories.sort((a, b) => a[1] - b[1]);
        return filterCategories;
    } else {
        console.debug("[INFO]: No valid categories found.");
        return [];
    }
};

/**
 * The `showTooltip` use to show the current information about item
 * pointed by mouse
 * 
 * @param {*} event - mouse moving data 
 * @param {Object} d - data, passed after fetch JSON
 * 
 */
const showTooltip = (event, d) => {

    tooltip.style('opacity', 0.9);
    tooltip
        .html(
            'Name: ' +
            d.data.name +
            '<br>Category: ' +
            d.data.category +
            '<br>Value: ' +
            d.data.value
        )
        .attr('data-value', d.data.value)
        .style('left', event.pageX + appSettings.remSize + 'px')
        .style('top', event.pageY - 2 * appSettings.remSize + 'px');
};

// hide tooltip
const hideTooltip = () => tooltip.style('opacity', 0);

/**
 * The `generateLegend` fuction used to get the svg legend
 * it based on data, hold into `appSettings.rangeColors`
 * it looks like [name, RGBColor]
 * 
 * @returns {svg} - based under main svg and show the color item and group/category name
 */
const generateLegend = () => {
    if ( !appSettings.rangeColors ||  !appSettings.rangeColors.length ) return 0;
    // console.debug(appSettings.rangeColors);

    d3.select('#legend').remove();

    let legend = d3
        .select('#container')
        .append('svg')
        .attr('id', 'legend');

    legend
        .attr('width', appSettings.svgW)
        .attr('min-height', Math.floor(appSettings.svgH * 0.2));

    let countColumns = Math.floor( appSettings.svgW / appSettings.legend.h_spacing);

    // console.log(countColumns)

    const translateX = ind => Math.floor((ind % countColumns) * appSettings.legend.h_spacing);

    const translateY = ind => Math.floor(ind / countColumns) * appSettings.legend.rect_size +
    appSettings.legend.w_spacing * Math.floor(ind / countColumns);

    let legendItem = legend
        .append('g')
        .attr('transform', `translate(${4 * appSettings.remSize}, ${appSettings.legend.offset})`)
        .selectAll('g')
        .data(appSettings.rangeColors.reverse())
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${translateX(i)},${translateY(i)})`);

    legendItem
        .append('rect')
        .attr('width', appSettings.legend.rect_size)
        .attr('height', appSettings.legend.rect_size)
        .attr('class', 'legend-item')
        .attr('fill', d => d[1] || DEFAULT_CONFIG.ERROR_CELL_COLOR);

    legendItem
        .append('text')
        .attr('x', appSettings.legend.rect_size + appSettings.legend.text_x_offset)
        .attr('y', appSettings.legend.rect_size + appSettings.legend.text_y_offset)
        .style('fill', 'var(--main-color)')
        .text(d => d[0]);

    return {
        success: true,
        message: DEFAULT_CONFIG.DEFAULT_SUCCESS_MSG('Generate Legend')
    }
};


/**
 * The `generateSVG` function used to create a svg
 * 
 * @param {Array} legendData - data, passed from getChilrens function, that contain unique groups
 * - by using the name (first parameter) into every array, 
 * - from `appSettings.rangeColors` get the current valid color by index and compare the category.name
 * 
 * @param {Object} data - passed after JSON fetch
 * 
 * at the end, pass the legend data to create the Legend
*/
const generateSVG = (legendData, data) => {
    // console.log(data);
    document.querySelector('#treemap').innerHTML = null;

    // let svg = d3.select('svg');
    // console.debug([appSettings.svgW, appSettings.svgH]);
    let treemap = d3
        .treemap()
        .size([appSettings.svgW, appSettings.svgH])
        .paddingInner(appSettings.paddingInner);

    let root = d3
        .hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    let cell = svg
        .selectAll('g')
        .data(root.leaves())
        .enter()
        .append('g')
        .attr('class', 'group')
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    cell
        .append('rect')
        .attr('id', d => d.data.id)
        .attr('class', 'tile')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('data-name', d => d.data.name)
        .attr('data-category', d => d.data.category)
        .attr('data-value', d => d.data.value)
        .attr('fill', d => {
            const getArr = arr => arr[0] === d.data.category;
            return appSettings.rangeColors[legendData.findIndex(getArr)][1] || DEFAULT_CONFIG.ERROR_CELL_COLOR
            })
        .on('mouseover', (e, d) => showTooltip(e, d))
        .on('mouseout', () => hideTooltip());
    
    cell
        .append('text')
        .attr('class', 'tile-text')
        .attr('x', d => {
            if (typeof d.x0 !== 'undefined' && typeof d.x1 !== 'undefined') {
                return (d.x0 + d.x1) / 2;
            } else {
                console.warn('x0 or x1 is undefined:', d);
                return 0;
            }
        })
        .attr('y', d => (d.y1 - d.y0) / 2)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'middle')
        .style('font-size', d => {
            const cellWidth = d.x1 - d.x0;
            return Math.min(appSettings.remSize, cellWidth / d.data.name.length) * 0.8 + 'px';
        })
        .attr('transform', d => `translate(${(d.x1 - d.x0) / 2}, ${(-appSettings.remSize)})`)
        .selectAll('tspan')
        .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
        .enter()
        .append('tspan')
        .attr('x', 0)
        .attr('dy', (d, i) => (i > 0 ? appSettings.remSize : 0))
        .text(d => d);

    generateLegend();
}

/**
 * The `processingData` function processes the data correctly.
 *
 * @param {Object} data - The object passed after JSON fetch.
 * 
 * This function:
 * - Updates the treemap name in `appSettings.treemapName`.
 * - Retrieves the `maxValue` by category name in first-level children.
 * - Sorts categories by `maxValue`.
 * 
 * @returns {Array} - An array holding [category.name, category.max.value].
 * 
 * If the array is valid:
 * - Passes `array` to `generateColorRange` function for valid cell colors.
 * - Passes the array and data to `generateSVG` function for SVG generation.
 */
const processingData = data => {
    if (data.name) {
        appSettings.treemapName = data.name;
    } else {
        console.debug("[INFO]: The data passed to `processingData` has no valid 'name' key.");
    }

    const categories = getCategories(data);
    
    // console.debug(categories);
    
    if (categories.length) {
        generateColorRange(categories);
        // console.debug(appSettings.rangeColors);
        generateSVG(categories, data);
    } else {
        return {
            success: false,
            message: DEFAULT_CONFIG.ERROR_EMPTY('Data.children'),
        };
    }
};


/**
 * the `generateFooter` used to fill the footer
 * 
 * The function:
 * - add link to course on FreeCodeCamp.org
 * - add link to FCC Forum
 * - add some author information and link to FCC account
 * 
 *  - It is only executed once when the page loads.  
*/
const generateFooter = () => {

    const fccCourseLink = "https://www.freecodecamp.org/learn/data-visualization/";
    const fccNewsLink = "https://www.freecodecamp.org/news/";
    const fccForumLink = "https://forum.freecodecamp.org/";
    const fccOrgStart = 2014;
    const fccAuthorAccountLink = "https://www.freecodecamp.org/AKOHb";

    let block = `
    <div 
        id='footer-container'
        style="display: flex; justify-content: space-between; margin: 2rem 2rem 0.5rem 2rem;"
        >
        <a href="${fccNewsLink}" target="_block">FCC News</a>
        <a href="${fccCourseLink}" target="_block">Data Visualization Course</a>
        <a href="${fccForumLink}" target="_block">FCC Forum</a>

        <a href="${fccAuthorAccountLink}" target="_block">made by AKOHb</a>
        <span>FCC ${fccOrgStart} - ${new Date().getFullYear()}</span>
    </div>
    `;

    document.querySelector('footer').innerHTML = block;
};

/**   
 * The `main` function used to start the app
 * 
 * --before the main function started functions, that has only one start after page loading
*/
const main = () => {
    try {
        // Update the body structure
        updateBody();

        // Dynamically create buttons based on the DATASETS
        createButtons(DATASETS);

        // Generate the footer
        generateFooter();

        console.debug('[INFO]: App initialized successfully.');
    } catch (error) {
        console.error('[ERROR]: App initialization failed:', error);
    }
};

main();
