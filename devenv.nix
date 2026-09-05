{
  pkgs,
  ...
}:

{
  packages = [
    pkgs.git
    pkgs.github-cli
  ];

  languages.javascript = {
    enable = true;
    bun = {
      enable = true;
      install.enable = true;
    };
  };

  services.caddy = {
    enable = true;
    virtualHosts."http://localhost:8000" = {
      extraConfig = ''
        root * ./dist
        file_server
        handle_errors {
          @404 {
            expression {http.error.status_code} == 404
          }
          rewrite @404 /404.html
          file_server
        }
        encode
      '';
    };
  };

  treefmt = {
    enable = true;
    config.programs = {
      nixfmt.enable = true;
      prettier.enable = true;
    };
  };
}
