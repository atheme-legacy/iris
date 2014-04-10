package
{
     import flash.utils.ByteArray;
     import flash.display.MovieClip;
     import flash.events.Event;
     import flash.events.ErrorEvent;
     import flash.events.IOErrorEvent;
     import flash.events.SecurityErrorEvent;
     import flash.events.ProgressEvent;
     import flash.net.Socket;
     import flash.system.Security;
     import flash.external.ExternalInterface;

     public class JsSocket
     {
          private var id:int;
          private var host:String;
          private var port:int;
          private var xmlport:int;
          private var socket:Socket;

          private const CONNECTING:int = 0;
          private const OPEN:int = 1;
          private const CLOSING:int = 2;
          private const CLOSED:int = 3;
          private const ERROR:int = 4;
          private const MESSAGE:int = 5;

          public function JsSocket():void {
               socket = new Socket();
               socket.addEventListener(Event.CONNECT, onConnect);
               socket.addEventListener(Event.CLOSE, onDisconnect);
               socket.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
               socket.addEventListener(IOErrorEvent.IO_ERROR, onError);
               socket.addEventListener(ProgressEvent.SOCKET_DATA, onData);
          }

          public function connect(host:String, port:int, xmlport):void {
               Security.loadPolicyFile("xmlsocket://"+host+":"+xmlport);
               socket.connect(host, port);
               ExternalInterface.call("FlashSocket.state", CONNECTING, "CONNECTING");
          }

          public function disconnect():void {
               socket.close();
               ExternalInterface.call("FlashSocket.state", CLOSED, "");
          }

          private function write(data:String):void {
               socket.writeUTFBytes(data);
               socket.flush();
          }

          private function onConnect(e:Event):void {
               ExternalInterface.call("FlashSocket.state", OPEN, e.toString());
          }

          private function onDisconnect(e:Event):void {
               ExternalInterface.call("FlashSocket.state", CLOSED, e.toString());
          }

          private function onError(e:ErrorEvent):void {
               ExternalInterface.call("FlashSocket.state", ERROR, e.toString());
               socket.close();
          }

          private function onData(e:ProgressEvent):void {
               var out:String = "[";
               out += socket.readUnsignedByte();
               while(socket.bytesAvailable)
                    out += ","+socket.readUnsignedByte();
               out += "]";
               ExternalInterface.call("FlashSocket.state", MESSAGE, out);
          }

     }

     public class Main extends MovieClip
     {
          private function Main():void {
               var socket:JsSocket = new JsSocket();
               flash.system.Security.allowDomain("*");
               flash.system.Security.allowInsecureDomain("*");
               ExternalInterface.marshallExceptions = true;

               ExternalInterface.addCallback("connect",    socket.connect);
               ExternalInterface.addCallback("disconnect", socket.disconnect);
               ExternalInterface.addCallback("write",      socket.write);
          }
     }
}
