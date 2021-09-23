// ==UserScript==
// @name         משתמשים מורחקים
// @match        https://mitmachim.top/*
// @match        https://tchumim.com/*
// @match        https://xn--9dbazrsfz.com/*
// @grant        none
// ==/UserScript==

/* globals $, app, utils */

const search = '?section=bannedes'
const link = $(`<li><a href="/users${search}">מורחק</a></li>`)
const olLink = `<li itemscope="itemscope" itemprop="itemListElement" itemtype="http://schema.org/ListItem">
<meta itemprop="position" content="1"><a href="/users" itemprop="item"><span itemprop="name">משתמשים</span></a></li>
<li component="breadcrumb/current" itemscope="itemscope" itemprop="itemListElement" itemtype="http://schema.org/ListItem" class="active">
<meta itemprop="position" content="2"><span itemprop="name">מורחק</span></li>`

$(window).on('action:ajaxify.end', () => {
    if (location.pathname == '/users') {
        $('.nav.nav-pills').append(link)
        if (location.search == search) {
            link.addClass('active')
            $('meta[content="1"]').parent().remove()
            $('ol').append(olLink)
            $('div[component="pagination"]').remove()
            $('#search-user').prop('disabled', true)
            $('#users-container').empty()
            app.alert({
                alert_id: 'loading_bannedes',
                title: 'טוען נתונים <i class="fa fa-spinner fa-pulse"></i>',
                message: 'אנא המתן...'
            })
            setTimeout(() => { document.title = document.title.replace('אחרונים', 'מורחקים') })
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
                                    .addClass('avatar avatar-lg avatar-rounded').attr({ 'alt': username, 'title': '', 'data-uid': user.uid, 'loading': 'lazy', 'data-original-title': username })
                                ), `<br><div class="user-info"><span><a href="/user/${user.userslug}">${username}</a></span></div>`
                            )
                        )
                    }
                })
                app.removeAlert('loading_bannedes')
            })
        }
        else {
            link.removeClass('active')
            $('#search-user').prop('disabled', false)
        }
    }
})
