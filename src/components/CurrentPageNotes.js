import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import MiniSearchNote from './MiniSearchNote'
const CurrentPageNotes = (props) => {
    const [url, setCurrentUrl] = useState('')

    useEffect(() => {
        console.log("props")
        console.log(props)
        console.log("getting current tab")
        chrome.tabs.query({ active: true }, tabs => {
            let url = tabs[0].url
            console.log("got current tab")
            console.log(url)
            setCurrentUrl(url)
        });
    }, [])

    return (<div>
        <h1>Current Notes on Page</h1>
        {url == '' || url == null || url == undefined && <div>You are not on a valid page to add a note</div>}
        {url != '' && url != null && url != undefined && Object.keys(props.notes).map(key => {
            if (key == url) {
                return props.notes[key].notes.map(note => {
                    return <MiniSearchNote {...note} website={note.url}></MiniSearchNote>
                })
            }
        })}
    </div>)
}

const mapStateToProps = (state) => {
    return { notes: state }
}

export default connect(mapStateToProps, null)(CurrentPageNotes)