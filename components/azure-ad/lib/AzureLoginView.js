import React, {
	Component
} from 'react'
import {
	Dimensions,
	AsyncStorage,
	Platform,
	StyleSheet,
	View,
	Text
} from 'react-native'

import { WebView } from 'react-native-webview';
import AzureInstance from './AzureInstance'
import Auth from './Auth';

export default class AzureLoginView extends React.Component {
	props : {
		azureInstance: AzureInstance,
		onSuccess? : ?Function
	};

	state : {
	    visible: bool
  	};

	constructor(props:any){
		super(props);

		this.auth = new Auth(this.props.azureInstance);
		this.state = {
			visible: true
		}

		this._handleTokenRequest = this._handleTokenRequest.bind(this);
		this._renderLoadingView = this._renderLoadingView.bind(this);
	}

	_handleTokenRequest(e:{ url:string }):any{
		// get code when url chage

		let code = /((\?|\&)code\=)[^\&]+/.exec(e.url);

		if( code !== null ){
			code = String(code[0]).replace(/(\?|\&)?code\=/,'');
			this.setState({visible : false})

			// request for a token
			this.auth.getGraphTokenFromCode(code).then(token => {
				// set token to instance

				if(token.error){
					/* REWORK TO */
					/* FIRE OFF ADMIN CONSENT */
					const error_message = token.error_message ? token.error_message : 'Something has gone wrong, please try again later.';
					this.props.azureInstance.setError(error_message);
				}

				this.props.azureInstance.setGraphToken(token);

				this.auth.getChataboxTokenFromRefreshToken(token).then(chataboxToken => {

					// set token to instance
					this.props.azureInstance.setChataboxToken(chataboxToken);

					// call success handler
					this.props.onSuccess();
				})

			})
			.catch((err) => {
        		throw new Error(err);

      		})
		}
  	}

  	_renderLoadingView(){

  		return this.props.loadingView === undefined ? (
  			<View
  				style={[this.props.style, styles.loadingView,
  					{
						flex:1,
						alignSelf : 'stretch',
						width : Dimensions.get('window').width,
						height : Dimensions.get('window').height
					}
				]}
  			>
  				<Text>{this.props.loadingMessage}</Text>
  			</View>
  		) : this.props.loadingView
  	}

	render() {
		let js = `document.getElementsByTagName('body')[0].style.height = '${Dimensions.get('window').height}px';`

   		return (

			this.state.visible ? (
				<WebView
					automaticallyAdjustContentInsets={true}
					style={[this.props.style, styles.webView, {
						flex:1,
						alignSelf : 'stretch',
						width : Dimensions.get('window').width,
						height : Dimensions.get('window').height
					}]}
					source={{uri: this.auth.getAuthUrl()}}
					javaScriptEnabled={true}
					domStorageEnabled={true}
					decelerationRate="normal"
					javaScriptEnabledAndroid={true}
					onNavigationStateChange={this._handleTokenRequest}
					onShouldStartLoadWithRequest={(e) => {return true}}
					startInLoadingState={true}
					injectedJavaScript={js}
					scalesPageToFit={true}
				/> ) : this._renderLoadingView()
		)
   	}

}

const styles = StyleSheet.create({
	webView: {
		marginTop: 0
	},
	loadingView: {
		alignItems: 'center',
		justifyContent: 'center'
	}
});
