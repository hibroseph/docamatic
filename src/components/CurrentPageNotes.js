import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import MiniSearchNote from './MiniSearchNote'
const CurrentPageNotes = (props) => {
    const [url, setCurrentUrl] = useState('')

    useEffect(() => {
        chrome.tabs.query({ active: true }, tabs => {
            let url = tabs[0].url
            setCurrentUrl(url)
        });
    }, [])

    const [noteOnPage, setNoteOnPage] = useState(false);

    return (
        <div>
            <p style={{
                fontWeight: "bold",
                fontSize: "20px",
                margin: "10px 5px 0px 10px"
            }}>Current Notes on Page</p>
            { url == '' || url == null || url == undefined || !url.match(/https?/) && <div>You are not on a valid page to add a note</div>}
            {
                url != '' && url != null && url != undefined && Object.keys(props.notes).map(key => {
                    if (key == url) {
                        return props.notes[key].notes.map(note => {
                            return <MiniSearchNote {...note} website={key}></MiniSearchNote>
                        })
                    }
                })
            }
        </div >)
}

const mapStateToProps = (state) => {
    return { notes: state }
}

export default connect(mapStateToProps, null)(CurrentPageNotes)