import { Modal } from 'antd';

interface TechSpecsModalProps {
    open: boolean;
    onClose: () => void;
    os: 'linux' | 'windows';
}

export const TechSpecsModal = ({ open, onClose, os }: TechSpecsModalProps) => (
    <Modal
        title="Technical Specifications"
        open={open}
        onCancel={onClose}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        footer={null}
    >
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-4 text-left font-semibold w-1/4">Core Software</th>
                        <th className="border border-gray-200 p-4 text-left font-semibold w-1/4">Database</th>
                        <th className="border border-gray-200 p-4 text-left font-semibold w-1/4">Additional Supported Software</th>
                        <th className="border border-gray-200 p-4 text-left font-semibold w-1/4">Security</th>
                    </tr>
                </thead>
                <tbody>
                    {os === 'linux' ? (
                        <tr>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">CentOS 7.x*</div>
                                <div className="leading-loose">Apache 2.4</div>
                                <div className="leading-loose">cPanel 110</div>
                                <div className="leading-loose">PHP 8.3, 8.2 & 8.1</div>
                                <div className="leading-loose">MySQL version (server) 5.7</div>
                                <div className="leading-loose">MySQL client Yes</div>
                                <div className="leading-loose">Python 2.7 and 3.6</div>
                                <div className="leading-loose">PEAR Supported</div>
                                <div className="leading-loose">phpMyAdmin 5.2.1</div>
                                <div className="leading-loose">CloudFlare Supported</div>
                                <div className="leading-loose">Softaculous Supported</div>
                                <div className="leading-loose">ionCube Loader Supported</div>
                                <div className="leading-loose">PDO_MySQL Supported</div>
                                <div className="leading-loose">Perl Supported</div>
                                <div className="leading-loose">PHP Safe Mode Supported</div>
                                <div className="leading-loose">mcrypt Supported</div>
                                <div className="leading-loose">Zend Engine Supported</div>
                                <div className="leading-loose">eAccelerator Supported</div>
                                <div className="leading-loose">Ruby Supported</div>
                                <div className="leading-loose">zlib Supported</div>
                                <div className="leading-loose">cURL Supported</div>
                                <div className="leading-loose">cURL Library Functions Supported</div>
                                <div className="leading-loose">ImageMagick Supported</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">MySQL version (server) 5.7</div>
                                <div className="leading-loose">MySQL client Yes</div>
                                <div className="leading-loose">phpMyAdmin 5.2.1</div>
                                <div className="leading-loose">Toad for MySQL Supported</div>
                                <div className="leading-loose">MYSQL: MyISAM Supported</div>
                                <div className="leading-loose">formmail.cgi Supported</div>
                                <div className="leading-loose">SFTP Supported</div>
                                <div className="leading-loose">MySQL Admin tools Supported</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">Zend Optimizer Supported</div>
                                <div className="leading-loose">Zend Guard Loader Supported</div>
                                <div className="leading-loose">mod_mime.c Supported</div>
                                <div className="leading-loose">jQuery Supported</div>
                                <div className="leading-loose">InnooDB Supported</div>
                                <div className="leading-loose">SSI Supported</div>
                                <div className="leading-loose">mod_rewrite / URL rewrite Supported</div>
                                <div className="leading-loose">Ruby On Rails Supported</div>
                                <div className="leading-loose">Javascripts (only if embedded in HTML) Supported</div>
                                <div className="leading-loose">soap module Supported</div>
                                <div className="leading-loose">json Supported</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">Password protected folders Supported</div>
                                <div className="leading-loose">Hotlink Protection Supported</div>
                                <div className="leading-loose">Leech Protection Supported</div>
                            </td>
                        </tr>
                    ) : (
                        <tr>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">Windows 2022 (Standard) 64 bit</div>
                                <div className="leading-loose">Plesk Obsidian 18.x</div>
                                <div className="leading-loose">Microsoft-IIS 10</div>
                                <div className="leading-loose">PHP 7.4, 8.0, 8.1, 8.2 and above</div>
                                <div className="leading-loose">ASP Supported</div>
                                <div className="leading-loose">ASP.NET 3.5, ASP.NET 4.8</div>
                                <div className="leading-loose">.NET Framework 1.x /2.x /3.x /6.x /7.x</div>
                                <div className="leading-loose">ASP.NET MVC 5 Supported</div>
                                <div className="leading-loose">Perl 5.10.1</div>
                                <div className="leading-loose">Python 2.6 5.12</div>
                                <div className="leading-loose">URL Rewrite Supported</div>
                                <div className="leading-loose">json Supported</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">Microsoft SQL Server 2016 and 2017</div>
                                <div className="leading-loose">myLittleAdmin 3.8</div>
                                <div className="leading-loose">MySQL 8 and above</div>
                                <div className="leading-loose">phpMyAdmin 5</div>
                                <div className="leading-loose">Crystal Report Available</div>
                                <div className="leading-loose">Zend Engine Available</div>
                                <div className="leading-loose">ASP mail scripts Available</div>
                                <div className="leading-loose">PHP mail scripts Available</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">SilverLight Available</div>
                                <div className="leading-loose">Zend Guard Loader Available</div>
                                <div className="leading-loose">ionCube Loader Available</div>
                                <div className="leading-loose">jQuery Available</div>
                                <div className="leading-loose">Ajax Available</div>
                                <div className="leading-loose">WCF Service Available</div>
                                <div className="leading-loose">Windows Presentation Foundation or WPF Available</div>
                                <div className="leading-loose">Language Integrated Query or LinQ Available</div>
                            </td>
                            <td className="border border-gray-200 p-4 align-top">
                                <div className="leading-loose">Password Protected folders Supported</div>
                                <div className="leading-loose">Hotlink Protection Supported</div>
                                <div className="leading-loose">MSSQL SQL Server Supported</div>
                                <div className="leading-loose">MySQL 8 and above</div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </Modal>
);
