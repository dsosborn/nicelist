export function friendMail(fromName, origin) {
  const name = fromName || "Someone";
  return {
    subject: `${name} wants to be friends on Nicelist`,
    text: `${name} sent you a friend request on Nicelist.\n\nOpen ${origin}/friends to accept or decline.`,
  };
}

export function pokeMail(senderName, listName, band, origin) {
  const bandText = {
    UNDER_25: "under $25",
    MID: "from $25 to $75",
    OVER_75: "over $75",
  }[band] || "a price band";
  return {
    subject: `${senderName || "A friend"} poked you for more ideas ${bandText}`,
    text: `${senderName || "A friend"} poked you for more ideas ${bandText} on ${listName || "your list"}.\n\nOpen ${origin}/list`,
  };
}

export function claimMail(listName, giftTitle, purchased, origin) {
  const gift = giftTitle || "A gift";
  const verb = purchased ? "was marked purchased" : "was marked taken";
  return {
    subject: `${gift} on ${listName || "a list"} ${verb}`,
    text: `${gift} on ${listName || "a list"} ${verb}.\n\nOpen ${origin}/list`,
  };
}

export function stillOpenMail(listName, openCount, origin, token) {
  const count = openCount === 1 ? "1 gift is still open" : `${openCount} gifts are still open`;
  const link = token ? `${origin}/list?t=${token}` : `${origin}/list`;
  return {
    subject: `${listName || "A list"} still has gifts open`,
    text: `${listName || "A list"}: ${count}.\n\nOpen ${link}`,
  };
}

export function claimMailUserIds(list, friendIds, actorId) {
  if (!list) return [];
  const recipient = list.recipientId;
  const managers = (list.managerIds || [list.ownerId]).filter((id) => id && id !== recipient && id !== actorId);
  const friends =
    list.visibility === "PRIVATE" ? [] : (friendIds || []).filter((id) => id && id !== recipient && id !== actorId);
  const seen = {};
  const out = [];
  managers.concat(friends).forEach((id) => {
    if (!id || id === recipient || seen[id]) return;
    seen[id] = true;
    out.push(id);
  });
  return out;
}
