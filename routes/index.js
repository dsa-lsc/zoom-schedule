const express = require('express');
const router = express.Router();
const dotenv = require('dotenv').config();
const Promise = require('bluebird');
const moment = require('moment-timezone');

//include the zoom library
const Zoom = require("zoomus")({
  "key" : process.env.ZOOM_API_KEY,
  "secret" : process.env.ZOOM_API_SECRET
});

const listAsync = Promise.promisify(Zoom.user.list);

/* GET home page. */
router.get('/', async function(req, res, next) {
  let meetings = await fetchMeetingsForUser();

  const meetingsByDay = groupMeetingsByDays(meetings);

  res.render('index', { meetingsByDay });
});

function sortEvents (a, b) {
  return new Date(a.start_time || a.date) - new Date(b.start_time || b.date);
}

function groupMeetingsByDays (meetings) {
  return meetings
    .filter(m => {
      return moment(m.start_time).isAfter(moment())
    })
    .reduce((days, meeting) => {
      // const meetingMoment = moment(meeting.start_time);
      // console.log('meetingMoment', meeting.start_time, meetingMoment, meetingMoment.toDate());
      const date = moment(meeting.start_time).startOf('day').format('YYYY-MM-DD');
      const foundDate = days.find(day => day.date === date);

      meeting.startDate = moment.tz(meeting.start_time, meeting.timezone).format('h:mm z');
      meeting.endDate = moment.tz(meeting.start_time, meeting.timezone).add(meeting.duration, 'm').format('h:mm z');
      console.log('\t\t startDate', meeting.startDate)
      if (foundDate) {
        foundDate.meetings.push(meeting);
        foundDate.meetings.sort(sortEvents);
      } else {
        days.push({
          date,
          displayDate: moment(meeting.start_time).format('ddd, MMM Do YYYY'),
          meetings: [meeting]
        });
      }
      return days;
    }, [])
    .sort(sortEvents);
}


function fetchMeetingsForUser() {
  return new Promise((resolve, reject) => {
    Zoom.user.list((userList) => {
      const userId = userList.users[0].id;

      Zoom.meeting.list({host_id: userId}, async (meetingList) => {

        const meetings = [];
        for (meeting of meetingList.meetings) {
          if (meeting.type === 8) {
            meetings.push(...await retrieveMeeting(meeting.id, userId))
          } else {
            meetings.push({
              start_time: meeting.start_time,
              duration: meeting.duration,
              topic: meeting.topic,
              timezone: meeting.timezone
            });
          }
        }

        return resolve(meetings)
      })
    })
  })
}

function retrieveMeeting (meetingId, host_id) {
  return new Promise((resolve, reject) => {
    Zoom.meeting.get({id: meetingId, host_id}, (res) => {
      const occurrences = res.occurrences.map(occurrence => {
        return {
          timezone: res.timezone,
          start_time: occurrence.start_time,
          duration: occurrence.duration,
          topic: res.topic
        }
      })
      resolve(occurrences);
    });
  });
}

module.exports = router;
