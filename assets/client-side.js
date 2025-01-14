var checkedRegionCount=0;
var checkedPhysicalRegionCount=0;

/* Housekeeping stuff to do when the page finishes loading */
window.onload = function yeahyeah() {

    // If there's a Mailchimp submit button, add an event to it that will
    // disable the button when clicked, to avoid duplicate submissions.
    var button=document.getElementById("mc-embedded-subscribe");
    if (button) {

        // Function to re-enable the Submit button in case it was disabled.
        // Used when the user tries to correct an error, in order to allow
        // the user to retry submitting the form.
        function reEnableSubmit() {

            // Set a delay to allow the counter event to fire and update the counter
            // value before proceeding with this event. This feels like a terrible pattern,
            // but don't hate me. Send me a pull request instead.
            setTimeout(function() {
                if (checkedRegionCount>0) {
                    button.classList.remove("submitted");
                    button.disabled=false;
                } else if (document.location.pathname=='/event') {
                    button.classList.add("submitted");
                    button.disabled=true;
                }
            }, 10);
        }

        // On submit, disable the button to prevent double-clicks and other mayhem.
        button.onclick=function(e) {
            // Let the form be submitted before we actually disable the button. :)
            setTimeout(function() {
                e.target.classList.add("submitted");
                e.target.disabled=true;
            }, 50);
        }

        // Add an event listener to each <input> element on the page. If it changes,
        // and the Submit button is disabled, make sure to re-enable the Submit button.
        var allInputs=document.getElementsByTagName('input');
        Array.prototype.forEach.call(allInputs, function(input) {
            if (input.type=='checkbox') {
                input.addEventListener("click", reEnableSubmit);
            } else {
                input.addEventListener("change", reEnableSubmit);
            }
        });

        if (document.location.pathname=='/event') {
            button.classList.add("submitted");
            button.disabled=true;
        }

    }


    // If this is the event page, collect the subscriber count for each region:
    if (document.location.pathname=='/event') {
        var xhr1 = new XMLHttpRequest();
        xhr1.open('GET', '/assets/subscriber-count.json');
        xhr1.send();
    
        xhr1.onload = function() {
            if (xhr1.status == 200) {
                try {
                    var groups=JSON.parse(xhr1.response);
                    
                    Array.prototype.forEach.call(document.getElementsByTagName('label'), function(label) {
                        groups.forEach(group => {
                            if (label.innerText.replace('-', '').replace(' ', '').toUpperCase()==group.name.toUpperCase().replace('-', '').replace(' ', '')) {
                                var span=document.createElement('span');
                                span.className='subscriber-count';
                                span.innerText=group.subscriber_count;
                                label.appendChild(span);
                            }
                        });
                    });
                } catch(err) {
                    // No big deal.
                    console.log(err);
                }
            }
        }
    }


    // If there's a "counter" element in the footer (or anywhere on the page), collect
    // the number of campaigns and emails sent and update the counter text:
    var p_counter=document.body.querySelector('#counter');
    if (p_counter) {
        var xhr2 = new XMLHttpRequest();
        xhr2.open('GET', '/assets/campaign-count.json');
        xhr2.send();
    
        xhr2.onload = function() {
            if (xhr2.status == 200) {
                try {
                    var stats=JSON.parse(xhr2.response);
                    p_counter.innerHTML= 'We\'ve sent '+stats.emails+' call for speaker emails for '+stats.campaigns+' events so far!';
                } catch(err) {
                    // Who cares.
                    console.log(err);
                }
            }
        }

    }




    // If this is the "List Events" page, populate the table using the REST API:
    var eventstbl=document.getElementById("eventstbl");
    if (eventstbl) {
        var tbody = eventstbl.getElementsByTagName("tbody")[0];

        var xhr3 = new XMLHttpRequest();
        xhr3.open('GET', '/api/events');
        xhr3.send();

        xhr3.onload = function() {
            if (xhr3.status == 200) {
                var rs = JSON.parse(xhr3.response);

                rs.forEach(row => {
                    var tr=document.createElement('tr');

                    var td1=document.createElement('td');
                    td1.innerText = new Date(row.Date).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
                    tr.appendChild(td1);

                    var td2=document.createElement('td');
                    var a=document.createElement('a');
                    a.href=row.URL;
                    a.innerText = row.EventName;
                    a.target='_blank';
                    td2.appendChild(a);
                    tr.appendChild(td2);

                    var td3=document.createElement('td');
                    td3.innerText=row.Venue;
                    tr.appendChild(td3);

                    tbody.appendChild(tr);
                });
            }
        }

    }




    // Add a click event to each region checkbox on the event page,
    // to make sure the organizer doesn't select more than two
    // regions:
    var maxTwo=document.getElementsByClassName("max-two");
    
    Array.prototype.forEach.call(maxTwo, function(e) {
        var inputs=e.getElementsByTagName("input");
        Array.prototype.forEach.call(inputs, function(input) {
            if (input.type=='checkbox') {
                input.onclick=regionCheckboxClicked;
            }
        });
    });

}

/* Make sure the event organizer doesn't check more than two regions. */
function regionCheckboxClicked(e) {

    // If we clicked on a physical region, update the counter..
    if (e.srcElement.value!='Virtual') {
        if (e.srcElement.checked) {
            checkedPhysicalRegionCount++;
            checkedRegionCount++;
        } else {
            checkedPhysicalRegionCount--;
            checkedRegionCount--;
        }

        // ... and make sure we haven't selected more than two physical regions:
        if (checkedPhysicalRegionCount>2) {
            e.srcElement.checked=false;
            checkedPhysicalRegionCount--;
            checkedRegionCount--;
        }
    }

    // The total number of regions includes the "Virtual" region:
    if (e.srcElement.value=='Virtual') {
        if (e.srcElement.checked) {
            checkedRegionCount++;
        } else {
            checkedRegionCount--;
        }
    }
}
