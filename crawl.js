const { JSDOM } = require('jsdom')

async function crawlPage (baseURL, currentURL, pages) {
    
    const baseURLObj = new URL(baseURL)
    const currentURLObj = new URL(currentURL)
    const normalizeCurrentURL = normalizeURL(currentURL)


    if(baseURLObj.hostname !== currentURLObj.hostname){
        return pages
    }

    if(pages[normalizeCurrentURL] > 0) {
        pages[normalizeCurrentURL]++
        return pages
    }
    
    pages[normalizeCurrentURL] = 1

    console.log(`actively crawling: ${currentURL}`)

    try{
        const resp = await fetch(currentURL)

        if(resp.status > 399){
            console.log('error')
            return pages
        }

        const content = resp.headers.get("content-type")

        if(!content.includes('text/html')){
            console.log('non html response')
            return pages
        }
        const htmlBody = await resp.text()

        const nextURLs = getURLsFromHTML(htmlBody, baseURL)

        for(const URL of nextURLs){
            pages = await crawlPage(baseURL, URL, pages)
        }
        return pages

    } catch(err){
        console.log(err.message)
    }
    
}

function getURLsFromHTML(htmlBody, baseURL){
    const urls = []
    const dom = new JSDOM(htmlBody)
    const linkElements = dom.window.document.querySelectorAll('a')
    for(const elem of linkElements){
        if(elem.href.slice(0,1) === '/'){
            try{
                const urlObj = new URL(baseURL + elem.href)
                urls.push(baseURL + elem.href)
            } catch(err){
                console.log(err.message)
            }
        }
        else{
            try{
                const urlObj = new URL(elem.href)
                urls.push(elem.href)
            } catch(err){
                console.log(err.message)
            }
        }
    }
    return urls
}
function normalizeURL(urlString){
    const urlObj = new URL(urlString)
    const hostPath = `${urlObj.hostname}${urlObj.pathname}`
    if(hostPath.length > 0 && hostPath.slice(-1) == '/'){
        return hostPath.slice(0,-1)
    }
    return hostPath
}

module.exports = {
    normalizeURL, 
    getURLsFromHTML,
    crawlPage
}