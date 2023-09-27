# Courtesy of: https://stackoverflow.com/a/60890631

import boto3
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart


class Emailer(object):
    """ send email with attachments """
    
    def send(self, to, subject, fromx, body=None, content=None, attachments=None):
        """ sends email with attachments
        
        Parameters:
            * to (list or comma separated string of addresses): recipient(s) address
            * fromx (string): from address of email
            * body (string, optional): Body of email ('\n' are converted to '< br/>')
            * content (string, optional): Body of email specified as filename
            * attachments (list, optional): list of paths of files to attach
        """

        if attachments is None:
            attachments = []

        self.to = to
        self.subject = subject
        self.fromx = fromx
        self.attachment = None
        self.body = body
        self.content = content
        self.attachments = attachments
        
        if type(self.to) is list:
            self.to = ",".join(self.to)
        
        
        message = MIMEMultipart()
        
        message['Subject'] = self.subject
        message['From'] = self.fromx
        message['To'] = self.to
        if self.content and os.path.isfile(self.content):
            part = MIMEText(open(str(self.content)).read().replace("\n", "<br />"), "html")
            message.attach(part)
        elif self.body:
            part = MIMEText(self.body.replace("\\n", "<br />").replace("\n", "<br />"), "html")
            message.attach(part)
            
        print(self.attachments)
        for attachment in self.attachments:
            part = MIMEApplication(open(attachment, 'rb').read())
            part.add_header('Content-Disposition', 'attachment', filename=attachment.split("/")[-1])
            message.attach(part)
            
        ses = boto3.client('ses', region_name='us-east-1')
        
        response = ses.send_raw_email(
            Source=message['From'],
            Destinations=message['To'].split(","),
            RawMessage={
                'Data': message.as_string()
            }
        )