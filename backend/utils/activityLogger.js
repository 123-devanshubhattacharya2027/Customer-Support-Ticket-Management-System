
const Activity = require("../models/Activity");

const logActivity = async ({
    ticketId,
    action,
    oldValue = null,
    newValue = null,
    author = "System"
}) => {
    return await Activity.create({
        ticket: ticketId,
        action,
        oldValue,
        newValue,
        author
    });
};

module.exports = logActivity;
