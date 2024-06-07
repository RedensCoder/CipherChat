function formatLastSeen(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
        return `Был ${diffMins} минут назад`;
    } else if (diffHours < 24) {
        return `Был ${diffHours} часов назад`;
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

function dateFormat(dateString) {
    const date = new Date(dateString);

    const optionsTime = {
        hour: '2-digit',
        minute: '2-digit'
    };

    const optionsDate = {
        day: 'numeric',
        month: 'long'
    };

    const timeFormatter = new Intl.DateTimeFormat('ru-RU', optionsTime);
    const formattedTime = timeFormatter.format(date);

    const dateFormatter = new Intl.DateTimeFormat('ru-RU', optionsDate);
    const formattedDate = dateFormatter.format(date);

    return `${formattedTime} ${formattedDate}`;
}

module.exports = {formatLastSeen, dateFormat};