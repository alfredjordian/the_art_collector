const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=6b4532ee-c0ec-4add-a1a3-bda19287bc98'; // USE YOUR KEY HERE

async function fetchObjects() {
  const url = `${BASE_URL}/object?${KEY}`;
  try {
    const response = await fetch(url);  //<<<--- is it always beneficial to write code with this format vs using .then and .catch?
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error)


    //  fetch(url)
    //    .then(function (response) {
    //         return response.json()
    //     })
    //     .then(function (response) { <<<<---- without using await this is what it looks like, which is not synchronous
    //         console.log(response);
    //     })
    //     .catch(function (error) {
    //         console.error(error);
    //     });    
  }
}

async function fetchAllCenturies() {
  const url = `${BASE_URL}/century?${KEY}&size=100&sort=temporalorder`;

  if (localStorage.getItem('century')) {    // <<<-----the data is saved accross browser sessions with no expiration time, gets cleared when page is closed
    return JSON.parse(localStorage.getItem('century')); //<<<---- refer to wesley about the finer details as to why the fuck this works (line 34)
  }
  //<<<--- why is it that i have a singular classification on line 48 and plural on 49 and yet on this function everything is singular
  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem('century', JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error)
  }
}

async function fetchAllClassifications() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;
  if (localStorage.getItem('classifications')) {    // <<<-----the data is saved accross browser sessions with no expiration time, gets cleared when page is closed
    return JSON.parse(localStorage.getItem('classifications')); //<<<---- refer to wesley about the finer details
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;

    localStorage.setItem('classifications', JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error)
  }
}


(async function () {
  await fetchAllCenturies()
  await fetchAllCenturies()
})()


fetchObjects().then(x => console.log(x));

async function prefetchCategoryLists() {
  try {
    const [
      classifications, centuries
    ] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies()
    ]);

    $('.classification-count').text(`(${classifications.length})`);
    classifications.forEach(classification => {
      $('#select-classification')
        .append($(`<option value="${classification.name}">${classification.name}</option>`));
    });

    $('.century-count').text(`(${centuries.length})`);
    centuries.forEach(century => {
      $('#select-century')
        .append($(`<option value="${century.name}">${century.name}</option>`));
    });
  } catch (error) {
    console.error(error);
  }
}

prefetchCategoryLists();

function buildSearchString() {
  // .map and .forEach seem to do the exact same thing but .map is more effecient and manipulates the original data?
  const url = `${BASE_URL}/object?${KEY}`

  const terms = [...$('#search select')].map(element => {       //<<<---- first selects everything with the id containing select and search
    return `${$(element).attr('name')}=${$(element).val()}` // <<-- .attr returns the attributes value, i.e "century || classification"
  }).join('&');   // then it adds the value + '=' of that selected element to the string

  const keywords = `keyword=${$('#keywords').val()}`;
  //same thing, whatever is in the query value is interpolated in the return statement

  return `${url}&${terms}&${keywords}`

}

$('#search').on('submit', async function (event) {
  // prevent the default
  event.preventDefault();
  onFetchStart();

  try {
    const response = await fetch(buildSearchString()) //<<<-- how come the syntax without paranthesis isnt recommended here? i.e fetch(buildSearchString)
    const { records, info } = await response.json();
    encodeURI(response);
    updatePreview(records, info);
    // get the url from `buildSearchString`
    // fetch it with await, store the result
    // log out both info and records when you get them
  } catch (error) {
    console.error(error)
    // log out the error
  } finally {
    onFetchEnd();
  }
});

function onFetchStart() {
  $('#loading').addClass('active');
}

function onFetchEnd() {
  $('#loading').removeClass('active');
}


function renderPreview(objectRecord) {
  const {
    description,
    primaryimageurl,
    title,
  } = objectRecord;

  // grab description, primaryimageurl, and title from the record

  //Some of the items might be undefined, if so... don't render them

  //With the record attached as data, with key 'record'

  // return new element
  return $(`<div class="object-preview">
      <a href="#">
      ${primaryimageurl && title
      ? `<img src="${primaryimageurl}" /><h3>${title}<h3>`
      : title
        ? `<h3>${title}<h3>`
        : description
          ? `<h3>${description}<h3>`
          : `<img src="${primaryimageurl}" />`
    }
      </a>
    </div>`).data('objectRecord', objectRecord);
}



function updatePreview(records, info) {
  const root = $('#preview');

  if (info.next) {
    root.find('.next')
      .data('url', info.next)
      .attr('disabled', false);
  } else {
    root.find('.next')
      .data('url', null)
      .attr('disabled', true);
  }

  if (info.prev) {
    root.find('.previous')
      .data('url', info.prev)
      .attr('disabled', false);
  } else {
    root.find('.previous')
      .data('url', null)
      .attr('disabled', true);
  }

  // grab the results element, it matches .results inside root
  // empty it
  // loop over the records, and append the renderPreview

  const resultsElement = root.find('.results');
  resultsElement.empty();

  records.forEach(objectRecord => {
    resultsElement.append(
      renderPreview(objectRecord)
    );
  });

  resultsElement.animate({ scrollTop: 0 }, 500);
}





$('#preview .next, #preview .previous').on('click', async function () {
  onFetchStart();

  /*
    read off url from the target 
    fetch the url
    read the records and info from the response.json()
    update the preview
  */


  try {
    const url = $(this).data('url');
    const response = await fetch(url);
    const { records, info } = await response.json();

    updatePreview(records, info);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

$('#preview').on('click', '.object-preview', function (event) {
  event.preventDefault();

  // they're anchor tags, so don't follow the link
  // find the '.object-preview' element and recover the record from .data('record') (DONE ABOVE)
  // NEW => set the html() on the '#feature' element to renderFeature()

  const record = $(this).data('objectRecord');
  
  const featureElement = $('#feature');
  featureElement.html( renderFeature(record) );  
});

$('#feature').on('click', 'a', async function (event) {
  const href = $(this).attr('href');

  if (href.startsWith('mailto:')) {
    return;
  }

  event.preventDefault();

  onFetchStart();
  try {
    let result = await fetch(href);
    let { records, info } = await result.json();
    updatePreview(records, info);
  } catch (error) {
    console.error(error)
  } finally {
    onFetchEnd();
  }
});

function renderFeature(record) {
  /**
 * We need to read, from record, the following:
 * HEADER: title, dated
 * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
 * PHOTOS: images, primaryimageurl
 */

  // build and return template

  const {
    title,
    dated,
    images,
    primaryimageurl,
    description,
    culture,
    style,
    technique,
    medium,
    dimensions,
    people,
    department,
    division,
    contact,
    creditline,
  } = record;


  return $(`<div class="object-feature">
    <header>
      <h3>${title}<h3>
      <h4>${dated}</h4>
    </header>
    <section class="facts">
      ${factHTML('Description', description)}
      ${factHTML('Culture', culture, 'culture')}
      ${factHTML('Style', style)}
      ${factHTML('Technique', technique, 'technique')}
      ${factHTML('Medium', medium ? medium.toLowerCase() : null, 'medium')}
      ${factHTML('Dimensions', dimensions)}
      ${people
      ? people.map(
        person => factHTML('Person', person.displayname, 'person')
      ).join('')
      : ''
    }
      ${factHTML('Department', department)}
      ${factHTML('Division', division)}
      ${factHTML('Contact', `<a target="_blank" href="mailto:${contact}">${contact}</a>`)}
      ${factHTML('Credit', creditline)}
    </section>
    <section class="photos">
      ${photosHTML(images, primaryimageurl)}
    </section>
  </div>`);
}

function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}



function factHTML(title, content, searchTerm = null) {
// if content is empty or undefined, return an empty string ''

// otherwise, if there is no searchTerm, return the two spans

// otherwise, return the two spans, with the content wrapped in an anchor tag
  
  if (!content) {
    return ''
  }

  return `
    <span class="title">${title}</span>
    <span class="content">${searchTerm && content
      ? `<a href="${BASE_URL
      }/${'object'
      }?${KEY
      }&${searchTerm
      }=${encodeURI(content.split('-').join('|'))
      }">${content
      }</a>`
      : content
    }
    </span>
  `
}

function photosHTML(images, primaryimageurl) {
  if (images.length > 0) {
    return images.map(
      image => `<img src="${ image.baseimageurl }" />`).join('');
  } else if (primaryimageurl) {
    return `<img src="${ primaryimageurl }" />`;
  } else {
    return '';
  }
}
