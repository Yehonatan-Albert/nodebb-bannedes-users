// ==UserScript==
// @name         משתמשים מורחקים
// @match        https://mitmachim.top/*
// @match        https://tchumim.com/*
// @match        https://xn--9dbazrsfz.com/*
// @grant        none
// ==/UserScript==

/* globals $, app, ajaxify, utils */

const search = '?section=bannedes'
const link = $(`<li><a href="/users${search}">מורחק</a></li>`)

function addRefreshBtn() {
    $('div.users>div>div.text-right').append($(`<button class="btn btn-default">טען מחדש</button>`).click(() => {
        sessionStorage.removeItem('bannedesUsers')
        ajaxify.refresh()
    }))
}

$(window).on('action:ajaxify.end', () => {
    if (location.pathname == '/users') {
        $('.nav.nav-pills').append(link)
        if (location.search == search) {
            link.addClass('active')
            $('ol>.active').removeClass('active').removeAttr('component').children('span').wrap(`<a href="/users" itemprop="item"></a>`)
            $('ol').append(`<li component="breadcrumb/current" itemscope="itemscope" itemprop="itemListElement" itemtype="http://schema.org/ListItem" class="active">
<meta itemprop="position" content="2"><span itemprop="name">מורחק</span></li>`)
            $('div[component="pagination"]').remove()
            $('#search-user').prop('disabled', true)
            setTimeout(() => { document.title = document.title.replace('אחרונים', 'מורחקים') })
            if (sessionStorage.getItem('bannedesUsers')) {
                $('#users-container').html(sessionStorage.getItem('bannedesUsers'))
                $('.avatar.avatar-lg.avatar-rounded').tooltip('fixTitle')
                addRefreshBtn()
            }
            else {
                $('#users-container').empty()
                $(window).on('action:alert.new', (ev, data) => {
                    if (data.params.alert_id == 'alert_button_loading_bannedes') $('#alert_button_loading_bannedes').removeClass('alert-info').addClass('text-primary').children('.close').remove()
                })
                app.alert({
                    alert_id: 'loading_bannedes',
                    title: 'טוען נתונים <i style="margin-right: 5px;" class="fa fa-spinner fa-pulse"></i>',
                    message: 'אנא המתן...'
                })
                fetch('/api/users').then(res => res.json()).then(data =>
                    Promise.all(
                        Array.from({ length: data.pagination.pageCount }, (x, i) => i + 1).map(page =>
                            fetch(`/api/users?page=${page}`).then(res => res.json()).then(data =>
                                data.users.map(user => ({
                                    banned: user.banned,
                                    username: user.username,
                                    userslug: user.userslug,
                                    uid: user.uid,
                                    picture: user.picture,
                                    bgColor: user["icon:bgColor"],
                                    text: user["icon:text"]
                                }))
                            )
                        )
                    )
                ).then(pages => [].concat(...pages)).then(users => {
                    users.map(user => {
                        if (user.banned) {
                            var username = utils.decodeHTMLEntities(user.username)
                            $('#users-container').append(
                                $(`<li class="users-box registered-user" data-uid="${user.uid}"></li>`).append(
                                    $(`<a href="/user/${user.userslug}"></a>`).append(
                                        $(user.picture ? `<img component="avatar/picture" src="${user.picture}">` : `<span component="avatar/icon" style="background-color: ${user.bgColor};">${user.text}</span>`)
                                        .addClass('avatar avatar-lg avatar-rounded').attr({ 'alt': username, 'title': '', 'data-uid': user.uid, 'loading': 'lazy', 'data-original-title': username }).tooltip('fixTitle')
                                    ), `<br><div class="user-info"><span><a href="/user/${user.userslug}">${username}</a></span></div>`
                                )
                            )
                        }
                    })
                    app.removeAlert('loading_bannedes')
                    sessionStorage.setItem('bannedesUsers', $('#users-container').html())
                    addRefreshBtn()
                })
            }
        }
        else {
            link.removeClass('active')
            $('#search-user').prop('disabled', false)
        }
    }
})
