<?php

class OrderMeta
{

  public function __construct() 
  {
    add_action('woocommerce_checkout_create_order', array($this,'before_checkout_create_order'), 20, 2);
    add_action( 'woocommerce_admin_order_data_after_order_details', array($this,'display_meta_orders'), 10, 1 );
    add_action( 'woocommerce_checkout_order_processed', array($this,'meta_to_line_item') );
  }

  /**
   * Add order meta to created orders ('betellrunde_id)
   */
  function before_checkout_create_order( $order, $data ) {
    // get cart items to fetch bestellrunde_id
    $bestellrunde_ids_in_cart = array();
    foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
      $bestellrunde_id = $cart_item['bestellrunde'];
      if (!in_array($bestellrunde_id, $bestellrunde_ids_in_cart)) {
        array_push($bestellrunde_ids_in_cart, $bestellrunde_id);
      }
    }
    
    if (count($bestellrunde_ids_in_cart) == 1) {
      $order->update_meta_data( 'bestellrunde_id', $bestellrunde_ids_in_cart[0] );
    }
  }


  /**
   * Display field value on the order edit page
   */
  function display_meta_orders( $order ){
      $order_id = method_exists( $order, 'get_id' ) ? $order->get_id() : $order->id;
      $bestellrunde_id = get_post_meta( $order_id, 'bestellrunde_id', true );
      
      echo    '<p style="display: inline-block;margin-top:20px; font-size:20px; padding: 10px!important;background-color:#f0f0f0;color:green;">'.__('Bestellrunde').':<strong> ' . $bestellrunde_id . '</strong></p>';    
  }

  function meta_to_line_item( $order_id )
  {

    $order = wc_get_order($order_id);

    foreach ($order->get_items() as $item_id => $item_obj) {

        $p = $item_obj->get_product();
        $id = $p->get_id();

        $key = '_lieferant';
        $value = get_post_meta($id, $key, true );
        wc_update_order_item_meta($item_id, $key, $value);

        $key = '_einheit';
        $value = get_post_meta($id, $key, true );
        wc_update_order_item_meta($item_id, $key, $value);

        $key = '_herkunft';
        $value = get_post_meta($id, $key, true );
        wc_update_order_item_meta($item_id, $key, $value);

        $key = '_pid';
        $value = $id;
        wc_update_order_item_meta($item_id, $key, $value);

        $key = '_category';
        $value = $p->get_category_ids()[0];
        wc_update_order_item_meta($item_id, $key, $value);

        $key = '_sku';
        $value = $p->get_sku();
        wc_update_order_item_meta($item_id, $key, $value);

    }

  }



}