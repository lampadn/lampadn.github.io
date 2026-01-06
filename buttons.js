(function() {
    'use strict';

    const LAMPAC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.331 14.644l-13.794-13.831 17.55 10.075zM2.938 0c-0.813 0.425-1.356 1.2-1.356 2.206v27.581c0 1.006 0.544 1.781 1.356 2.206l16.038-16zM29.512 14.1l-3.681-2.131-4.106 4.031 4.106 4.031 3.756-2.131c1.125-0.893 1.125-2.906-0.075-3.8zM6.538 31.188l17.55-10.075-3.756-3.756z" fill="currentColor"></path></svg>`;

    const EXCLUDED_CLASSES = ['button--play', 'button--edit-order'];

    const DEFAULT_GROUPS = [
        { name: 'online', patterns: ['online', 'lampac', 'modss', 'showy'], label: 'Онлайн' },
        { name: 'torrent', patterns: ['torrent'], label: 'Торренты' },
        { name: 'trailer', patterns: ['trailer', 'rutube'], label: 'Трейлеры' },
        { name: 'favorite', patterns: ['favorite'], label: 'Избранное' },
        { name: 'subscribe', patterns: ['subscribe'], label: 'Подписка' },
        { name: 'book', patterns: ['book'], label: 'Закладки' },
        { name: 'reaction', patterns: ['reaction'], label: 'Реакции' }
    ];

    let currentButtons = [];
    let allButtonsOriginal = [];
    let currentContainer = null;

    const storageGet = (key, def) => Lampa.Storage.get(key, def);
    const storageSet = (key, val) => Lampa.Storage.set(key, val);

    const getCustomOrder = () => storageGet('button_custom_order', []);
    const setCustomOrder = order => storageSet('button_custom_order', order);
    const getHiddenButtons = () => storageGet('button_hidden', []);
    const setHiddenButtons = hidden => storageSet('button_hidden', hidden);

    function getButtonId(button) {
        const classes = button.attr('class') || '';
        const text = button.find('span').text().trim().replace(/\s+/g, '_');
        const subtitle = button.attr('data-subtitle') || '';

        if (classes.includes('modss') || text.includes('MODS') || text.includes('MOD')) return 'modss_online_button';
        if (classes.includes('showy') || text.includes('Showy')) return 'showy_online_button';

        const viewClasses = classes.split(' ').filter(c => c.startsWith('view--') || c.startsWith('button--')).join('_');
        let id = viewClasses ? `${viewClasses}_${text}` : 'button_unknown';

        if (subtitle) id += `_${subtitle.replace(/\s+/g, '_').substring(0, 30)}`;

        return id;
    }

    function getButtonType(button) {
        const classes = button.attr('class') || '';
        for (const group of DEFAULT_GROUPS) {
            if (group.patterns.some(p => classes.includes(p))) return group.name;
        }
        return 'other';
    }

    function isExcluded(button) {
        const classes = button.attr('class') || '';
        return EXCLUDED_CLASSES.some(c => classes.includes(c));
    }

    function categorizeButtons(container) {
        const buttons = container.find('.full-start__button').not('.button--edit-order, .button--play');
        const categories = { online: [], torrent: [], trailer: [], favorite: [], subscribe: [], book: [], reaction: [], other: [] };

        buttons.each(function() {
            const $btn = $(this);
            if (isExcluded($btn)) return;

            const type = getButtonType($btn);

            if (type === 'online' && $btn.hasClass('lampac--button') && !$btn.hasClass('modss--button') && !$btn.hasClass('showy--button')) {
                const svg = $btn.find('svg').first();
                if (svg.length && !svg.hasClass('modss-online-icon')) svg.replaceWith(LAMPAC_ICON);
            }

            categories[type].push($btn);
        });

        return categories;
    }

    function sortByCustomOrder(buttons) {
        const customOrder = getCustomOrder();

        const priority = buttons
            .filter(btn => ['modss_online_button', 'showy_online_button'].includes(getButtonId(btn)))
            .sort((a, b) => getButtonId(a) === 'modss_online_button' ? -1 : 1);

        const regular = buttons.filter(btn => !priority.includes(btn));

        if (!customOrder.length) {
            const typeOrder = ['online', 'torrent', 'trailer', 'favorite', 'subscribe', 'book', 'reaction', 'other'];
            regular.sort((a, b) => {
                const ia = typeOrder.indexOf(getButtonType(a));
                const ib = typeOrder.indexOf(getButtonType(b));
                return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
            });
            return [...priority, ...regular];
        }

        const sorted = [];
        const remaining = [...regular];
        customOrder.forEach(id => {
            const idx = remaining.findIndex(btn => getButtonId(btn) === id);
            if (idx !== -1) {
                sorted.push(remaining[idx]);
                remaining.splice(idx, 1);
            }
        });

        return [...priority, ...sorted, ...remaining];
    }

    function applyHiddenButtons(buttons) {
        const hidden = getHiddenButtons();
        buttons.forEach(btn => btn.toggleClass('hidden', hidden.includes(getButtonId(btn))));
    }

    function applyButtonAnimation(visibleButtons) {
        visibleButtons.forEach((btn, i) => {
            btn.css({
                opacity: 0,
                animation: 'button-fade-in 0.4s ease forwards',
                'animation-delay': `${i * 0.08}s`
            });
        });
    }

    function createEditButton() {
        const btn = $(`<div class="full-start__button selector button--edit-order" style="order:9999;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 29" fill="none"><use xlink:href="#sprite-edit"></use></svg>
        </div>`);
        btn.on('hover:enter', openEditDialog);
        if (storageGet('buttons_editor_enabled') === false) btn.hide();
        return btn;
    }

    function saveOrder() {
        setCustomOrder(currentButtons.map(getButtonId));
    }

    function reorderButtons(container) {
        const target = container.find('.full-start-new__buttons');
        if (!target.length) return false;

        currentContainer = container;
        container.find('.button--play, .button--edit-order').remove();

        const categories = categorizeButtons(container);
        let allButtons = [].concat(
            categories.online, categories.torrent, categories.trailer,
            categories.favorite, categories.subscribe, categories.book,
            categories.reaction, categories.other
        );

        allButtons = sortByCustomOrder(allButtons);

        if (!allButtonsOriginal.length) {
            allButtonsOriginal = allButtons.map(b => b.clone(true, true));
        }

        currentButtons = allButtons;
        target.empty();

        const visible = [];
        allButtons.forEach(btn => {
            target.append(btn);
            if (!btn.hasClass('hidden')) visible.push(btn);
        });

        target.append(createEditButton());
        visible.push(target.find('.button--edit-order'));

        applyHiddenButtons(allButtons);

        const mode = storageGet('buttons_viewmode', 'default');
        target.removeClass('icons-only always-text');
        if (mode === 'icons') target.addClass('icons-only');
        if (mode === 'always') target.addClass('always-text');

        applyButtonAnimation(visible);

        setTimeout(() => setupButtonNavigation(container), 100);
        return true;
    }

    function setupButtonNavigation(container) {
        try { Lampa.Controller.toggle('full_start'); } catch(e) {}
    }

    function refreshController() {
        setTimeout(() => {
            try {
                Lampa.Controller.toggle('full_start');
                if (currentContainer) setupButtonNavigation(currentContainer);
            } catch(e) {}
        }, 50);
    }

    function getButtonDisplayName(btn) {
        let text = btn.find('span').text().trim();
        const classes = btn.attr('class') || '';
        const subtitle = btn.attr('data-subtitle') || '';

        if (!text) {
            const view = classes.split(' ').find(c => c.startsWith('view--') || c.startsWith('button--'));
            return view ? capitalize(view.replace(/^(view|button)--/, '').replace(/_/g, ' ')) : 'Кнопка';
        }

        const sameCount = currentButtons.filter(b => b.find('span').text().trim() === text).length;
        if (sameCount > 1) {
            if (subtitle) return `${text} <span style="opacity:0.5">(${subtitle.substring(0,30)})</span>`;
            const view = classes.split(' ').find(c => c.startsWith('view--'));
            if (view) return `${text} <span style="opacity:0.5">(${capitalize(view.replace('view--', '').replace(/_/g, ' '))})</span>`;
        }
        return text;
    }

    function capitalize(str) {
        return str ? str[0].toUpperCase() + str.slice(1) : str;
    }

    function openEditDialog() {
        const categories = categorizeButtons(currentContainer);
        const allButtons = [].concat(
            categories.online, categories.torrent, categories.trailer,
            categories.favorite, categories.subscribe, categories.book,
            categories.reaction, categories.other
        );
        currentButtons = sortByCustomOrder(allButtons);

        const list = $('<div class="menu-edit-list"></div>');
        const hidden = getHiddenButtons();
        const modes = ['default', 'icons', 'always'];
        const labels = { default: 'Стандартный', icons: 'Только иконки', always: 'С текстом' };
        let currentMode = storageGet('buttons_viewmode', 'default');

        const modeBtn = $(`<div class="selector viewmode-switch"><div style="text-align:center;padding:1em;">Вид кнопок: ${labels[currentMode]}</div></div>`);
        modeBtn.on('hover:enter', function() {
            currentMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
            storageSet('buttons_viewmode', currentMode);
            $(this).find('div').text(`Вид кнопок: ${labels[currentMode]}`);
            const target = currentContainer.find('.full-start-new__buttons');
            target.removeClass('icons-only always-text');
            if (currentMode === 'icons') target.addClass('icons-only');
            if (currentMode === 'always') target.addClass('always-text');
        });
        list.append(modeBtn);

        currentButtons.forEach(btn => {
            const display = getButtonDisplayName(btn);
            const icon = btn.find('svg').clone();
            const id = getButtonId(btn);
            const isHidden = hidden.includes(id);

            const item = $(`<div class="menu-edit-list__item">
                <div class="menu-edit-list__icon"></div>
                <div class="menu-edit-list__title">${display}</div>
                <div class="menu-edit-list__move move-up selector">[↑]</div>
                <div class="menu-edit-list__move move-down selector">[↓]</div>
                <div class="menu-edit-list__toggle toggle selector">[✓]</div>
            </div>`);

            item.toggleClass('menu-edit-list__item-hidden', isHidden);
            item.find('.menu-edit-list__icon').append(icon);
            item.data('button', btn).data('buttonId', id);

            item.find('.move-up').on('hover:enter', () => {
                let prev = item.prev();
                while (prev.hasClass('viewmode-switch')) prev = prev.prev();
                if (prev.length) {
                    item.insertBefore(prev);
                    const idx = currentButtons.indexOf(btn);
                    if (idx > 0) [currentButtons[idx-1], currentButtons[idx]] = [btn, currentButtons[idx-1]];
                    saveOrder();
                }
            });

            item.find('.move-down').on('hover:enter', () => {
                let next = item.next();
                while (next.hasClass('folder-reset-button')) next = next.next();
                if (next.length) {
                    item.insertAfter(next);
                    const idx = currentButtons.indexOf(btn);
                    if (idx < currentButtons.length - 1) [currentButtons[idx], currentButtons[idx+1]] = [currentButtons[idx+1], btn];
                    saveOrder();
                }
            });

            item.find('.toggle').on('hover:enter', () => {
                const nowHidden = !item.hasClass('menu-edit-list__item-hidden');
                item.toggleClass('menu-edit-list__item-hidden', nowHidden);
                btn.toggleClass('hidden', nowHidden);
                item.find('.dot').attr('opacity', nowHidden ? '0' : '1');

                const newHidden = nowHidden
                    ? [...hidden, id].filter((v, i, a) => a.indexOf(v) === i)
                    : hidden.filter(h => h !== id);
                setHiddenButtons(newHidden);
            });

            list.append(item);
        });

        const resetBtn = $(`<div class="selector folder-reset-button"><div style="text-align:center;padding:1em;">Сбросить по умолчанию</div></div>`);
        resetBtn.on('hover:enter', () => {
            storageSet('button_custom_order', []);
            storageSet('button_hidden', []);
            storageSet('buttons_viewmode', 'default');
            Lampa.Modal.close();
            setTimeout(() => reorderButtons(currentContainer) || refreshController(), 100);
        });
        list.append(resetBtn);

        Lampa.Modal.open({
            title: 'Порядок кнопок',
            html: list,
            size: 'small',
            scroll_to_center: true,
            onBack: () => {
                Lampa.Modal.close();
                reorderButtons(currentContainer);
                Lampa.Controller.toggle('full_start');
            }
        });
    }

    function init() {
        const style = `<style>
            @keyframes button-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
            .full-start__button { opacity:0; }
            .full-start__button.hidden { display:none !important; }
            .full-start-new__buttons { display:flex !important; flex-direction:row !important; flex-wrap:wrap !important; gap:0.5em !important; }
            .full-start-new__buttons.buttons-loading .full-start__button { visibility:hidden !important; }
            .folder-reset-button { background:rgba(200,100,100,0.3); margin-top:1em; border-radius:0.3em; }
            .folder-reset-button.focus { border:3px solid rgba(255,255,255,0.8); }
            .menu-edit-list__toggle.focus { border:2px solid rgba(255,255,255,0.8); border-radius:0.3em; }
            .full-start-new__buttons.icons-only .full-start__button span { display:none; }
            .full-start-new__buttons.always-text .full-start__button span { display:block !important; }
            .viewmode-switch { background:rgba(100,100,255,0.3); margin:0.5em 0 1em 0; border-radius:0.3em; }
            .viewmode-switch.focus { border:3px solid rgba(255,255,255,0.8); }
            .menu-edit-list__item-hidden { opacity:0.5; }
        </style>`;
        $('body').append($(style));

        Lampa.Listener.follow('full', e => {
            if (e.type !== 'complite') return;
            const container = e.object.activity.render();
            const target = container.find('.full-start-new__buttons');
            if (target.length) target.addClass('buttons-loading');

            setTimeout(() => {
                try {
                    if (!container.data('buttons-processed')) {
                        container.data('buttons-processed', true);
                        if (reorderButtons(container)) {
                            target.removeClass('buttons-loading');
                            refreshController();
                        }
                    }
                } catch (err) {
                    target.removeClass('buttons-loading');
                }
            }, 400);
        });

        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: { name: 'buttons_editor_enabled', type: 'trigger', default: true },
                field: { name: 'Редактор кнопок' },
                onChange: () => setTimeout(() => $('.button--edit-order').toggle(storageGet('buttons_editor_enabled', true)), 100),
                onRender: el => setTimeout(() => $('div[data-name="interface_size"]').after(el), 0)
            });
        }
    }

    init();
})();
