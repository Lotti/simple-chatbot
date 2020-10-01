/**
 *
 * @param {string} title
 * @param {string} description
 * @param {string[]} buttons
 * @returns {{document: {mainTemplate: {parameters: [string], items: [{type: string, items: []}]}, description: string, type: string, version: string}, type: string, token: string}}
 */
module.exports.audioTemplate = (title, description, buttons) => {
    const audioItems = [];

    // creating audio items

    if (title && title.length > 0) {
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: title
        });
    }

    if (description && description.length > 0) {
        if (audioItems.length > 0) {
            audioItems.push({
                type: "Silence",
                duration: 500,
            });
        }
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: description
        });
    }

    if (buttons && buttons.length > 0) {
        if (audioItems.length > 0) {
            audioItems.push({
                type: "Silence",
                duration: 500,
            });
        }
        audioItems.push({
            type: "Speech",
            contentType: "PlainText",
            content: buttons.join(', ')
        });
    }

    // assembling whole document

    return {
        type: 'Alexa.Presentation.APLA.RenderDocument',
        token: 'audioDocumentToken',
        document: {
            type: 'APLA',
            version: '0.8',
            description: 'audio layout with a sequencer',
            mainTemplate: {
                parameters: ['payload'],
                items: [
                    {
                        type: 'Sequencer',
                        items: audioItems
                    }
                ]
            }
        }
    };
};

/**
 *
 * @param {{pixelWidth: number, pixelHeight: number}} viewPort
 * @param {string} title
 * @param {string} description
 * @param {string[]} buttons
 * @param {string} image
 * @param {string} theme
 * @returns {{document: {import: [{name: string, version: string}], mainTemplate: {parameters: [string], items: [{paddingBottom: string, paddingRight: string, width: string, paddingTop: string, type: string, paddingLeft: string, items: [], justifyContent: string, direction: string, height: string}]}, description: string, theme: string, type: string, version: string}, type: string, token: string}}
 */
module.exports.displayTemplate = (viewPort, title, description, buttons, image, theme = 'dark') => {
    let displayItems = [];
    let titleItem, descriptionItem, buttonsItem, imageItem;

    // define content height value
    let contentHeight = '28vh'; // small screens
    let titleSize = '28dp';
    let descriptionSize = '22dp';
    if (viewPort.pixelHeight >= 750) { // large screens
        contentHeight = '50vh';
        titleSize = '40dp';
        descriptionSize = '30dp';
    } else if (viewPort.pixelHeight >= 600) { // medium screens
        contentHeight = '40vh';
        titleSize = '35dp';
        descriptionSize = '25dp';
    }

    // creating display items

    if (title && title.length > 0) {
        titleItem = {
            type: "Text",
            width: "auto",
            height: "auto",
            text: title,
            fontSize: titleSize,
            maxLines: 3,
        };
    }

    if (description && description.length > 0) {
        descriptionItem = {
            type: "ScrollView",
            width: "100%",
            height: contentHeight,
            shrink: 1,
            grow: 1,
            paddingRight: "@spacingSmall",
            item: {
                type: "Text",
                width: "100%",
                height: "auto",
                text: description,
                fontSize: descriptionSize,
            }
        };
    }

    if (buttons && buttons.length > 0) {
        buttonsItem = {
            type: "Container",
            direction: "row",
            width: "100%",
            wrap: "wrap",
            data: buttons,
            item: {
                type: "AlexaButton",
                id: "Button${index}",
                buttonText: "${data}",
                buttonStyle: "contained",
                accessibilityLabel: "${data}",
                theme: theme,
                primaryAction: [{type: "SendEvent", arguments: ["${data}"]}],
            },
        };
    }

    if (image) {
        imageItem = {
            type: "AlexaImage",
            imageSource: image,
            imageScale: "best-fill",
            imageAlignment: "center",
            imageAspectRatio: "square",
            imageBlurredBackground: true,
            imageRoundedCorner: true,
            imageHeight: contentHeight,
        };
    }

    // set up display logic

    if (titleItem) {
        displayItems = [titleItem];
    }

    if (imageItem) {
        displayItems.push({
            type: "Container",
            width: "100%",
            height: "auto",
            direction: "row",
            justifyContent: "spaceBetween",
            alignSelf: "center",
            alignItems: "center",
            items: [
                descriptionItem,
                imageItem
            ],
        });
    } else {
        displayItems.push(descriptionItem);
    }

    if (buttonsItem) {
        displayItems.push(buttonsItem);
    }

    // assembling whole document

    return {
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'displayDocumentToken',
        document: {
            type: 'APL',
            version: '1.4',
            theme: theme,
            description: 'display template: title, text, button, image',
            import: [{name: 'alexa-layouts', version: '1.2.0'}],
            mainTemplate: {
                parameters: ['payload'],
                items: [
                    {
                        type: "Container",
                        direction: "column",
                        height: "100%",
                        width: "100%",
                        alignItems: "start",
                        paddingTop: "@spacingSmall",
                        paddingRight: "@spacingSmall",
                        paddingBottom: "@spacingSmall",
                        paddingLeft: "@spacingSmall",
                        justifyContent: "spaceAround",
                        items: displayItems,
                    }
                ]
            }
        }
    };
};
