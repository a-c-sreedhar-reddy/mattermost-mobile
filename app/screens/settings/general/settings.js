// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {Navigation} from 'react-native-navigation';

import {goToScreen, dismissModal} from '@actions/navigation';
import LocalConfig from '@assets/config';
import StatusBar from '@components/status_bar';
import SettingsItem from '@screens/settings/settings_item';
import {t} from '@utils/i18n';
import {preventDoubleTap} from '@utils/tap';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {isValidUrl} from '@utils/url';

class Settings extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            clearErrors: PropTypes.func.isRequired,
            purgeOfflineStore: PropTypes.func.isRequired,
        }).isRequired,
        config: PropTypes.object.isRequired,
        currentTeamId: PropTypes.string.isRequired,
        currentUserId: PropTypes.string.isRequired,
        currentUrl: PropTypes.string.isRequired,
        errors: PropTypes.array.isRequired,
        intl: intlShape.isRequired,
        joinableTeams: PropTypes.array.isRequired,
        theme: PropTypes.object,
        isLandscape: PropTypes.bool.isRequired,
    };

    static defaultProps = {
        errors: [],
        joinableTeams: [],
    };

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === 'close-settings') {
            dismissModal();
        }
    }

    errorEmailBody = () => {
        const {config, currentUserId, currentTeamId, errors} = this.props;
        let contents = [
            'Please share a description of the problem:\n\n',
            `Current User Id: ${currentUserId}`,
            `Current Team Id: ${currentTeamId}`,
            `Server Version: ${config.Version} (Build ${config.BuildNumber})`,
            `App Version: ${DeviceInfo.getVersion()} (Build ${DeviceInfo.getBuildNumber()})`,
            `App Platform: ${Platform.OS}`,
        ];
        if (errors.length) {
            const errorArray = errors.map((e) => {
                const {error} = e;
                const stack = error.stack || '';
                return `Date: ${e.date}\nMessage: ${error.message}\nStack trace:\n${stack}\n\n`;
            }).join('');

            contents = contents.concat([
                '',
                'Errors:',
                errorArray,
            ]);
        }
        return contents.join('\n');
    };

    goToAbout = preventDoubleTap(() => {
        const {intl, config} = this.props;
        const screen = 'About';
        const title = intl.formatMessage({id: 'about.title', defaultMessage: 'About {appTitle}'}, {appTitle: config.SiteName || 'Mattermost'});

        goToScreen(screen, title);
    });

    goToNotifications = preventDoubleTap(() => {
        const {intl} = this.props;
        const screen = 'NotificationSettings';
        const title = intl.formatMessage({id: 'user.settings.modal.notifications', defaultMessage: 'Notifications'});

        goToScreen(screen, title);
    });

    goToDisplaySettings = preventDoubleTap(() => {
        const {intl} = this.props;
        const screen = 'DisplaySettings';
        const title = intl.formatMessage({id: 'user.settings.modal.display', defaultMessage: 'Display'});

        goToScreen(screen, title);
    });

    goToAdvancedSettings = preventDoubleTap(() => {
        const {intl} = this.props;
        const screen = 'AdvancedSettings';
        const title = intl.formatMessage({id: 'mobile.advanced_settings.title', defaultMessage: 'Advanced Settings'});

        goToScreen(screen, title);
    });

    goToSelectTeam = preventDoubleTap(() => {
        const {currentUrl, intl} = this.props;
        const screen = 'SelectTeam';
        const title = intl.formatMessage({id: 'mobile.routes.selectTeam', defaultMessage: 'Select Team'});
        const passProps = {
            currentUrl,
        };

        goToScreen(screen, title, passProps);
    });

    goToClientUpgrade = preventDoubleTap(() => {
        const {intl} = this.props;
        const screen = 'ClientUpgrade';
        const title = intl.formatMessage({id: 'mobile.client_upgrade', defaultMessage: 'Upgrade App'});
        const passProps = {
            userCheckedForUpgrade: true,
        };

        goToScreen(screen, title, passProps);
    });

    openErrorEmail = preventDoubleTap(() => {
        const {config, intl} = this.props;
        const recipient = config.SupportEmail;
        const subject = `Problem with ${config.SiteName} React Native app`;
        const mailTo = `mailto:${recipient}?subject=${subject}&body=${this.errorEmailBody()}`;

        Linking.openURL(mailTo).then(() => {
            this.props.actions.clearErrors();
        }).catch(() => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.mailTo.error.title',
                    defaultMessage: 'Error',
                }),
                intl.formatMessage({
                    id: 'mobile.mailTo.error.text',
                    defaultMessage: 'Unable to open an email client.',
                }),
            );
        });
    });

    openHelp = preventDoubleTap(() => {
        const {config, intl} = this.props;
        const link = config.HelpLink ? config.HelpLink.toLowerCase() : '';

        Linking.openURL(link).catch(() => {
            Alert.alert(
                intl.formatMessage({
                    id: 'mobile.link.error.title',
                    defaultMessage: 'Error',
                }),
                intl.formatMessage({
                    id: 'mobile.link.error.text',
                    defaultMessage: 'Unable to open the link.',
                }),
            );
        });
    });

    render() {
        const {config, joinableTeams, theme, isLandscape} = this.props;
        const style = getStyleSheet(theme);
        const showTeams = joinableTeams.length > 0;
        const showHelp = isValidUrl(config.HelpLink);

        let showArrow = false;
        let middleDividerStyle = style.divider;
        if (Platform.OS === 'ios') {
            showArrow = true;
            middleDividerStyle = style.middleDivider;
        }

        return (
            <View
                testID='general_settings.screen'
                style={style.container}
            >
                <StatusBar/>
                <ScrollView
                    alwaysBounceVertical={false}
                    contentContainerStyle={style.wrapper}
                >
                    <View style={style.divider}/>
                    <SettingsItem
                        testID='general_settings.notifications.action'
                        defaultMessage='Notifications'
                        i18nId={t('user.settings.modal.notifications')}
                        iconName='bell-outline'
                        onPress={this.goToNotifications}
                        showArrow={showArrow}
                        theme={theme}
                        separator={true}
                        isLandscape={isLandscape}
                    />
                    <SettingsItem
                        testID='general_settings.display.action'
                        defaultMessage='Display'
                        i18nId={t('user.settings.modal.display')}
                        iconName='layers-outline'
                        onPress={this.goToDisplaySettings}
                        showArrow={showArrow}
                        theme={theme}
                        separator={true}
                        isLandscape={isLandscape}
                    />
                    {showTeams &&
                    <React.Fragment>
                        <SettingsItem
                            testID='general_settings.select_team.action'
                            defaultMessage='Open teams you can join'
                            i18nId={t('mobile.select_team.join_open')}
                            iconName='menu'
                            onPress={this.goToSelectTeam}
                            showArrow={showArrow}
                            theme={theme}
                            separator={true}
                            isLandscape={isLandscape}
                        />
                    </React.Fragment>
                    }
                    <SettingsItem
                        testID='general_settings.advanced.action'
                        defaultMessage='Advanced Settings'
                        i18nId={t('mobile.advanced_settings.title')}
                        iconName='tune'
                        onPress={this.goToAdvancedSettings}
                        showArrow={showArrow}
                        theme={theme}
                        separator={true}
                        isLandscape={isLandscape}
                    />
                    {LocalConfig.EnableMobileClientUpgrade && LocalConfig.EnableMobileClientUpgradeUserSetting &&
                    <React.Fragment>
                        <SettingsItem
                            testID='general_settings.check_for_upgrade.action'
                            defaultMessage='Check for Upgrade'
                            i18nId={t('mobile.settings.modal.check_for_upgrade')}
                            iconName='update'
                            onPress={this.goToClientUpgrade}
                            showArrow={showArrow}
                            theme={theme}
                            separator={true}
                            isLandscape={isLandscape}
                        />
                    </React.Fragment>
                    }
                    <SettingsItem
                        testID='general_settings.about.action'
                        defaultMessage='About {appTitle}'
                        messageValues={{appTitle: config.SiteName || 'Mattermost'}}
                        i18nId={t('about.title')}
                        iconName='information-outline'
                        onPress={this.goToAbout}
                        separator={false}
                        showArrow={showArrow}
                        theme={theme}
                        isLandscape={isLandscape}
                    />
                    <View style={middleDividerStyle}/>
                    {showHelp &&
                    <React.Fragment>
                        <SettingsItem
                            testID='general_settings.help.action'
                            defaultMessage='Help'
                            i18nId={t('mobile.help.title')}
                            onPress={this.openHelp}
                            showArrow={false}
                            theme={theme}
                            separator={true}
                            isLandscape={isLandscape}
                            isLink={true}
                        />
                    </React.Fragment>
                    }
                    <SettingsItem
                        testID='general_settings.report.action'
                        defaultMessage='Report a Problem'
                        i18nId={t('sidebar_right_menu.report')}
                        onPress={this.openErrorEmail}
                        showArrow={false}
                        theme={theme}
                        separator={false}
                        isLandscape={isLandscape}
                        isLink={true}
                    />
                    <View style={style.divider}/>
                </ScrollView>
            </View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        container: {
            flex: 1,
            backgroundColor: theme.centerChannelBg,
        },
        wrapper: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.06),
            ...Platform.select({
                ios: {
                    flex: 1,
                    paddingTop: 35,
                },
            }),
        },
        divider: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 1,
        },
        middleDivider: {
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: changeOpacity(theme.centerChannelColor, 0.1),
            height: 35,
        },
    };
});

export default injectIntl(Settings);
