//
//  ViewController.swift
//  IOS_Befrend
//
//  Created by Trevor Yokoyama on 11/27/19.
//  Copyright © 2019 Trevor Yokoyama. All rights reserved.
//
import UIKit
import WebKit



class ViewController: UIViewController, WKNavigationDelegate {

    var webView: WKWebView!
    
    override func loadView() {
        webView = WKWebView()
        webView.navigationDelegate = self
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
    
        let url = URL(string: "https://befrend.herokuapp.com")!
        webView.load(URLRequest(url: url))
      
        let refresh = UIBarButtonItem(barButtonSystemItem: .refresh, target: webView, action: #selector(webView.reload))
        toolbarItems = [refresh]
        navigationController?.isToolbarHidden = false
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        title = webView.title
    }
}
